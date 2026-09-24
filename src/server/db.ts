import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseState, getInitialState } from '../lib/storage.ts';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'primecafe2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'prime_cafe_secret_key_2026';

function getDatabaseFilePath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  // Vercel serverless functions have a writable /tmp directory
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp/prime_cafe_db.json';
  }
  return path.join(process.cwd(), 'data', 'prime_cafe_db.json');
}

let inMemoryState: DatabaseState | null = null;

export function getDatabase(): DatabaseState {
  if (inMemoryState) {
    return inMemoryState;
  }

  const filePath = getDatabaseFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseState;
      if (parsed.restaurant && Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
        inMemoryState = parsed;
        return inMemoryState;
      }
    }
  } catch (err) {
    console.warn('Could not read persistent DB file, using initial seed:', err);
  }

  inMemoryState = getInitialState();
  saveDatabase(inMemoryState);
  return inMemoryState;
}

export function saveDatabase(state: DatabaseState): boolean {
  inMemoryState = state;
  const filePath = getDatabaseFilePath();

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Gracefully handle read-only filesystems (EROFS) in serverless environments
    console.warn('Notice: Read-only filesystem detected, saved in memory:', err);
    return false;
  }
}

// Generate stateless HMAC signature token
export function generateAdminToken(): string {
  const payload = {
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

// Verify stateless HMAC token
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  // Also accept client-side offline mock token if necessary
  if (token === 'client_token_prime_cafe_2026') return true;

  const parts = token.replace(/^Bearer\s+/i, '').split('.');
  if (parts.length !== 2) return false;

  const [body, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(body)
    .digest('base64url');

  if (signature !== expectedSig) return false;

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (parsed.exp && parsed.exp < Date.now()) return false;
    return parsed.role === 'admin';
  } catch {
    return false;
  }
}

export function checkAdminPassword(attempt: string): boolean {
  return attempt === ADMIN_PASSWORD;
}

Prime Cafe Pre-Deployment Checklist
Before triggering or promoting a production deployment to Vercel, run through this verification checklist to guarantee 100% parity between Google AI Studio preview and production:
1. Dependency Resolution & Lockfile Integrity

Run npm ls esbuild vite @tailwindcss/vite to ensure zero ELSPROBLEMS or peer conflicts.

package.json pins esbuild: "^0.28.2" (aligned with vite@8.3.1 and tsx).

package-lock.json is generated, up-to-date, and committed to git.

Run npm ci locally to verify clean headless install without --legacy-peer-deps or --force.
2. Static Asset Build & Image Pipeline

Run npm run build (executes node update-unique-images.cjs && vite build).

Verify all 62 menu items have verified images in dist/assets/images/ and public/assets/images/.

Run npm run audit:images to verify local file presence (62/62) and remote CDN HTTP status.
3. Currency & Price Integrity

Run npx tsx test/verify.ts to confirm 100% compliance with Ethiopian Birr integer pricing.

Confirm no $, USD, ETB, or decimal .00 strings in user-facing templates.

Confirm item portion sizes use formatBirr (150 Birr, 300 Birr, 500 Birr) and never unformatted raw abbreviations like 150B.
4. Serverless & Routing Compatibility

api/index.ts mounts apiRouter on both /api and / to support both path conventions in Vercel Serverless Functions.

vercel.json excludes /assets/ and /downloads/ from the SPA index rewrite to prevent 404 images from silently returning 200 HTML documents.

Cache headers specify immutable only for version-hashed code bundles (.js, .css), with stale-while-revalidate for images.
5. Persistent Table QR Code

Verify that changing item prices in the database or admin dashboard preserves the exact same QR URL (/menu/prime-cafe).

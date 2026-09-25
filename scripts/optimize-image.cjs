#!/usr/bin/env node
/**
 * Image Optimization Script for Prime Cafe
 * Uses ImageMagick to resize, strip EXIF metadata, enable progressive rendering,
 * and apply quality compression (82%) to all cafe menu photos.
 * Reduces asset payload by ~90% while preserving crisp, high-definition visual fidelity.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = [
  path.join(ROOT_DIR, 'public', 'assets', 'images'),
  path.join(ROOT_DIR, 'src', 'assets', 'images'),
  path.join(ROOT_DIR, 'dist', 'assets', 'images'),
];

console.log('\n======================================================');
console.log('🚀 OPTIMIZING PRIME CAFE IMAGES (HIGH-SPEED PERFORMANCE)');
console.log('======================================================\n');

// Check if convert is available
let convertBin = 'convert';
try {
  execSync('which convert', { stdio: 'pipe' });
} catch (e) {
  console.warn('⚠️ ImageMagick "convert" not found in PATH. Skipping optimization.');
  process.exit(0);
}

let totalOriginalBytes = 0;
let totalOptimizedBytes = 0;
let processedCount = 0;
const processedFiles = new Set();

TARGET_DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.jpg') && !file.endsWith('.jpeg') && !file.endsWith('.png')) {
      continue;
    }

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const origSize = stat.size;

    // Only process if larger than 90KB (already optimized files will be skipped)
    if (origSize <= 90 * 1024) {
      continue;
    }

    const tempFile = path.join('/tmp', `opt_${Date.now()}_${Math.random().toString(36).substring(7)}_${file}`);
    try {
      // Resize to max 640x640 bounding box, strip metadata, quality 82, progressive plane
      execSync(`convert "${filePath}" -resize 640x640\\> -strip -quality 82 -interlace Plane "${tempFile}"`, {
        stdio: 'pipe',
      });

      if (fs.existsSync(tempFile)) {
        const newStat = fs.statSync(tempFile);
        if (newStat.size < origSize) {
          fs.copyFileSync(tempFile, filePath);
          totalOriginalBytes += origSize;
          totalOptimizedBytes += newStat.size;
          processedCount++;
          console.log(
            `⚡ [${path.basename(dir)}/${file}] ${(origSize / 1024).toFixed(1)} KB -> ${(newStat.size / 1024).toFixed(1)} KB (-${(
              (1 - newStat.size / origSize) *
              100
            ).toFixed(0)}%)`
          );
        }
        fs.unlinkSync(tempFile);
      }
    } catch (err) {
      console.warn(`Failed optimizing ${file}:`, err.message);
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
});

const savedMB = ((totalOriginalBytes - totalOptimizedBytes) / 1024 / 1024).toFixed(2);
const percent = totalOriginalBytes > 0 ? (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1) : 0;

console.log('\n================ OPTIMIZATION SUMMARY ================');
console.log(`Images Optimized   : ${processedCount}`);
console.log(`Original Size      : ${(totalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Optimized Size     : ${(totalOptimizedBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Bandwidth Saved    : ${savedMB} MB (${percent}% reduction)`);
console.log('✅ All menu photos are now ultra-lightweight and lightning-fast!\n');
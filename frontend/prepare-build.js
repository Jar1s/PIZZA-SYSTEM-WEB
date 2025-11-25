#!/usr/bin/env node
/**
 * Prepare build for Vercel deployment
 * Copies shared module into frontend directory if it doesn't exist
 */
const fs = require('fs');
const path = require('path');

const frontendDir = __dirname;
const sharedSource = path.join(frontendDir, '..', 'shared');
const sharedDest = path.join(frontendDir, 'shared');

console.log('🔧 Preparing build for Vercel...');
console.log(`📁 Frontend directory: ${frontendDir}`);
console.log(`📁 Shared source: ${sharedSource}`);
console.log(`📁 Shared destination: ${sharedDest}`);

// Check if shared source exists
if (!fs.existsSync(sharedSource)) {
  console.error(`❌ ERROR: Shared module not found at ${sharedSource}`);
  process.exit(1);
}

// Check if shared destination already exists
if (fs.existsSync(sharedDest)) {
  console.log('✅ Shared module already exists in frontend directory');
  // Verify it's not a stale copy by checking if index.ts exists
  if (fs.existsSync(path.join(sharedDest, 'index.ts'))) {
    console.log('✅ Shared module is valid');
    return;
  } else {
    console.log('⚠️  Shared module exists but is invalid, removing...');
    fs.rmSync(sharedDest, { recursive: true, force: true });
  }
}

// Copy shared module
console.log('📦 Copying shared module...');
try {
  // Create destination directory
  if (!fs.existsSync(sharedDest)) {
    fs.mkdirSync(sharedDest, { recursive: true });
  }

  // Copy all files from shared source to shared destination
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyRecursive(sharedSource, sharedDest);
  
  // Verify copy was successful
  if (!fs.existsSync(path.join(sharedDest, 'index.ts'))) {
    throw new Error('Shared module copy failed - index.ts not found');
  }
  
  console.log('✅ Shared module copied successfully');
} catch (error) {
  console.error(`❌ Failed to copy shared module: ${error.message}`);
  process.exit(1);
}



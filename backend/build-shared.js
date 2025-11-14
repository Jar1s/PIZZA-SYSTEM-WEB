#!/usr/bin/env node
// Build shared module to dist/shared
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sharedDir = path.join(__dirname, '..', 'shared');
const distSharedDir = path.join(__dirname, 'dist', 'shared');

console.log('📦 Building shared module...');

try {
  // Ensure dist/shared directory exists
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }
  if (!fs.existsSync(distSharedDir)) {
    fs.mkdirSync(distSharedDir, { recursive: true });
  }

  // Compile shared module - use absolute paths to avoid issues with spaces
  const indexTsPath = path.join(sharedDir, 'index.ts');
  const tscCommand = `npx --package=typescript tsc --outDir "${distSharedDir}" --module commonjs --target es2020 --declaration false --skipLibCheck "${indexTsPath}"`;
  
  console.log(`Running: ${tscCommand}`);
  execSync(tscCommand, {
    cwd: sharedDir,
    stdio: 'inherit',
    shell: true
  });
  
  // Verify the file was created
  const indexJsPath = path.join(distSharedDir, 'index.js');
  if (!fs.existsSync(indexJsPath)) {
    throw new Error(`Shared module compilation failed - ${indexJsPath} not found`);
  }
  console.log(`✅ Verified: ${indexJsPath} exists`);

  console.log('✅ Shared module built successfully');
} catch (error) {
  console.error('❌ Failed to build shared module:', error.message);
  process.exit(1);
}


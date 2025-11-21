#!/usr/bin/env node
// Build shared module to dist/shared
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find shared module - check current directory first (Docker), then parent (local dev)
const sharedInCurrent = path.join(__dirname, 'shared');
const sharedInParent = path.join(__dirname, '..', 'shared');
const sharedDir = fs.existsSync(sharedInCurrent) ? sharedInCurrent : sharedInParent;

const distSharedDir = path.join(__dirname, 'dist', 'shared');

console.log('📦 Building shared module...');
console.log(`📁 Shared module location: ${sharedDir}`);

try {
  // Ensure dist/shared directory exists
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }
  if (!fs.existsSync(distSharedDir)) {
    fs.mkdirSync(distSharedDir, { recursive: true });
  }

  // Verify shared module exists
  const indexTsPath = path.join(sharedDir, 'index.ts');
  if (!fs.existsSync(indexTsPath)) {
    throw new Error(`Shared module not found at: ${indexTsPath}`);
  }

  // Compile shared module - use absolute paths to avoid issues with spaces
  const tscCommand = `npx --package=typescript tsc --outDir "${distSharedDir}" --module commonjs --target es2020 --declaration false --skipLibCheck "${indexTsPath}"`;
  
  console.log(`Running: ${tscCommand}`);
  execSync(tscCommand, {
    cwd: sharedDir,
    stdio: 'inherit',
    shell: '/bin/sh'
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


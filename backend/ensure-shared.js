#!/usr/bin/env node
// Ensure shared module exists - called before starting
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const sharedPath = path.join(distDir, 'shared', 'index.js');

// Only check if dist directory exists (don't build if nothing is built yet)
if (fs.existsSync(distDir) && !fs.existsSync(sharedPath)) {
  console.log('📦 Shared module missing, building...');
  try {
    const buildScript = path.join(__dirname, 'build-shared.js');
    execSync(`node "${buildScript}"`, { stdio: 'inherit' });
    console.log('✅ Shared module built successfully');
  } catch (error) {
    console.error('❌ Failed to build shared module:', error.message);
    process.exit(1);
  }
}




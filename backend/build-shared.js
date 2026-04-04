#!/usr/bin/env node
// Build shared module to dist/shared
const { execFileSync } = require('child_process');
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

  const sharedTsconfigPath = path.join(sharedDir, 'tsconfig.json');
  if (!fs.existsSync(sharedTsconfigPath)) {
    throw new Error(`Shared tsconfig not found at: ${sharedTsconfigPath}`);
  }

  // Prefer the backend's local TypeScript binary. On Render, production installs
  // can omit devDependencies, so fall back to a pinned npm package version.
  const npxBinary = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const localTscBinary = path.join(
    __dirname,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
  );
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  let fallbackTypescriptVersion = '5.9.3';
  if (fs.existsSync(packageLockPath)) {
    try {
      const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
      fallbackTypescriptVersion =
        packageLock?.packages?.['node_modules/typescript']?.version || fallbackTypescriptVersion;
    } catch (error) {
      console.warn(`⚠️ Could not read package-lock.json, using fallback TypeScript ${fallbackTypescriptVersion}`);
    }
  }

  const compileArgs = [
    '--project',
    sharedTsconfigPath,
    '--outDir',
    distSharedDir,
    '--declaration',
    'false',
    '--declarationMap',
    'false',
  ];

  if (fs.existsSync(localTscBinary)) {
    console.log(`Running: ${localTscBinary} ${compileArgs.join(' ')}`);
    execFileSync(localTscBinary, compileArgs, {
      cwd: __dirname,
      stdio: 'inherit',
    });
  } else {
    const tscArgs = [
      '--yes',
      '--package',
      `typescript@${fallbackTypescriptVersion}`,
      'tsc',
      ...compileArgs,
    ];
    console.log(`Running: ${npxBinary} ${tscArgs.join(' ')}`);
    execFileSync(npxBinary, tscArgs, {
      cwd: __dirname,
      stdio: 'inherit',
    });
  }
  
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

#!/usr/bin/env node
// Fix main.js to add module-alias setup
const fs = require('fs');
const path = require('path');

// Try main.js first, then main (without extension)
const distDir = path.join(__dirname, 'dist');
let mainJsPath = path.join(distDir, 'main.js');

if (!fs.existsSync(mainJsPath)) {
  const mainPath = path.join(distDir, 'main');
  if (fs.existsSync(mainPath)) {
    mainJsPath = mainPath;
    console.log('📝 Using dist/main (without extension)');
  } else {
    // List all files in dist to help debug
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir, { withFileTypes: true });
      const fileList = files
        .filter(f => f.isFile())
        .map(f => f.name)
        .join(', ');
      const dirList = files
        .filter(f => f.isDirectory())
        .map(f => f.name)
        .join(', ');
      console.error('❌ main.js or main not found in dist/');
      console.error('📁 Files in dist:', fileList || '(none)');
      console.error('📁 Directories in dist:', dirList || '(none)');
    } else {
      console.error('❌ dist/ directory does not exist!');
    }
    // Don't exit - maybe nest build failed, but we should still try to continue
    console.warn('⚠️  Continuing without fixing main.js - nest build may have failed');
    process.exit(0); // Exit with 0 to not fail the build
  }
}

let content = fs.readFileSync(mainJsPath, 'utf8');

// Check if module resolution fix is already added
const hasModuleFix = content.includes('@pizza-ecosystem/shared') && 
                     content.includes('Module._resolveFilename');

if (!hasModuleFix) {
  // Ensure shared module exists before adding fix
  const sharedPath = path.join(__dirname, 'dist', 'shared', 'index.js');
  if (!fs.existsSync(sharedPath)) {
    console.log('⚠️  Shared module not found, building it...');
    try {
      const { execSync } = require('child_process');
      const buildScript = path.join(__dirname, 'build-shared.js');
      execSync(`node "${buildScript}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to build shared module:', error.message);
      process.exit(1);
    }
  }
  
  // Load setup-module-resolution.js at the very beginning
  // This must be the FIRST require to ensure it runs before any other modules
  const setupRequire = `require('./setup-module-resolution.js');\n`;
  
  // Insert after "use strict" but before any other code
  content = content.replace('"use strict";', `"use strict";\n${setupRequire}`);
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('✅ Added module resolution setup to main.js');
} else {
  // Update existing fix to use relative path if it's using absolute
  if (content.includes('/Users/') || content.includes('C:\\') || content.match(/['"]\/[^'"]+backend\/dist\/shared/)) {
    console.log('🔄 Updating to use relative path...');
    const relativePathFix = `const sharedModulePath = path.join(__dirname, 'shared', 'index.js');`;
    content = content.replace(
      /const sharedModulePath = .+;/,
      relativePathFix
    );
    fs.writeFileSync(mainJsPath, content, 'utf8');
    console.log('✅ Updated to use relative path');
  } else {
    console.log('✅ module resolution already configured');
  }
}



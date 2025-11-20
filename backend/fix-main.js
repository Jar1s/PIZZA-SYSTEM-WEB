#!/usr/bin/env node
// Fix main.js to add module-alias setup
const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'dist', 'main.js');
if (!fs.existsSync(mainJsPath)) {
  console.error('main.js not found');
  process.exit(1);
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
  
  // Use relative path from main.js location (portable)
  const aliasSetup = `const path = require('path');
const Module = require('module');
const fs = require('fs');
const originalResolveFilename = Module._resolveFilename;
// Use __dirname to resolve shared module path dynamically (relative to main.js)
const sharedModulePath = path.join(__dirname, 'shared', 'index.js');
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@pizza-ecosystem/shared') {
    if (!fs.existsSync(sharedModulePath)) {
      throw new Error('Shared module not found at: ' + sharedModulePath + '\\n' +
        'Please run: cd backend && node build-shared.js');
    }
    return sharedModulePath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
`;
  
  content = content.replace('"use strict";', `"use strict";\n${aliasSetup}`);
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('✅ Added module resolution fix to main.js');
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



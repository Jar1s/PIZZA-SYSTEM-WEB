#!/usr/bin/env node
// Setup module resolution for @pizza-ecosystem/shared
// This must be loaded BEFORE any other modules that use @pizza-ecosystem/shared
const path = require('path');
const Module = require('module');
const fs = require('fs');

// Get the directory where this script is located (should be in dist/)
const distDir = __dirname;
const sharedModulePath = path.join(distDir, 'shared', 'index.js');

// Verify shared module exists
if (!fs.existsSync(sharedModulePath)) {
  throw new Error(
    `Shared module not found at: ${sharedModulePath}\n` +
    `Please ensure dist/shared/index.js exists.`
  );
}

// Override Module._resolveFilename to handle @pizza-ecosystem/shared
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@pizza-ecosystem/shared') {
    return sharedModulePath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

console.log('✅ Module resolution for @pizza-ecosystem/shared configured');



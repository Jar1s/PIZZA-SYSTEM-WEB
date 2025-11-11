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

// Check if module-alias is already added
if (!content.includes("module-alias/register")) {
  // Add module-alias setup after "use strict"
  // Use addPath instead of addAlias to avoid interfering with node_modules resolution
  const aliasSetup = `const path = require('path');
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@pizza-ecosystem/shared') {
    return path.join(__dirname, 'shared', 'index.js');
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
`;
  
  content = content.replace('"use strict";', `"use strict";\n${aliasSetup}`);
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('✅ Added module resolution fix to main.js');
} else {
  console.log('✅ module resolution already configured');
}



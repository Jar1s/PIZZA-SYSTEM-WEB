#!/usr/bin/env node
// Mirror ../shared into ./shared before the build so the whole compilation
// lives under backend/ (rootDir-safe on every platform, incl. Render).
// No-op when ../shared is absent (e.g. backend deployed standalone with a
// pre-existing mirror).
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'shared');
const target = path.join(__dirname, 'shared');

if (!fs.existsSync(source)) {
  console.log(`ℹ️  ${source} not found — keeping existing ./shared as-is`);
  process.exit(0);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log('🔁 Mirrored ../shared -> ./shared');

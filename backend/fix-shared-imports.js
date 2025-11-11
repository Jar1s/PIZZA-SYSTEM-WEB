#!/usr/bin/env node
// Fix shared imports in compiled JavaScript files
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix: require("./types/X.types") -> require("./types/X.types.js")
  const typePattern = /require\(["']\.\/types\/([^"']+)\.types["']\)/g;
  if (typePattern.test(content)) {
    content = content.replace(typePattern, 'require("./types/$1.types.js")');
    modified = true;
  }

  // Fix: require("./contracts/api-endpoints") -> require("./contracts/api-endpoints.js")
  const contractPattern = /require\(["']\.\/contracts\/api-endpoints["']\)/g;
  if (contractPattern.test(content)) {
    content = content.replace(contractPattern, 'require("./contracts/api-endpoints.js")');
    modified = true;
  }

  // Fix: require("...shared/index.ts") -> require("@pizza-ecosystem/shared")
  const sharedTsPattern = /require\(["'][^"']*shared\/index\.ts["']\)/g;
  if (sharedTsPattern.test(content)) {
    content = content.replace(sharedTsPattern, 'require("@pizza-ecosystem/shared")');
    modified = true;
  }

  // Fix: require("...shared/index") -> require("@pizza-ecosystem/shared")
  const sharedIndexPattern = /require\(["'][^"']*shared\/index["']\)/g;
  if (sharedIndexPattern.test(content)) {
    content = content.replace(sharedIndexPattern, 'require("@pizza-ecosystem/shared")');
    modified = true;
  }

  // Fix: require("../shared") -> require("@pizza-ecosystem/shared")
  const relativeSharedPattern = /require\(["']\.\.\/shared["']\)/g;
  if (relativeSharedPattern.test(content)) {
    content = content.replace(relativeSharedPattern, 'require("@pizza-ecosystem/shared")');
    modified = true;
  }

  // Fix: require("../../shared") -> require("@pizza-ecosystem/shared")
  const relativeShared2Pattern = /require\(["']\.\.\/\.\.\/shared["']\)/g;
  if (relativeShared2Pattern.test(content)) {
    content = content.replace(relativeShared2Pattern, 'require("@pizza-ecosystem/shared")');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.js')) {
      if (fixImportsInFile(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Main execution
if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found');
  process.exit(1);
}

// Copy backend/src to dist if needed
const backendSrc = path.join(distDir, 'backend', 'src');
if (fs.existsSync(backendSrc)) {
  const files = fs.readdirSync(backendSrc);
  for (const file of files) {
    const srcPath = path.join(backendSrc, file);
    const destPath = path.join(distDir, file);
    if (fs.statSync(srcPath).isDirectory()) {
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy shared to dist if needed
const sharedSrc = path.join(distDir, 'shared');
try {
  if (fs.existsSync(sharedSrc) && fs.statSync(sharedSrc).isDirectory()) {
    const sharedDest = path.join(__dirname, 'dist', 'shared');
    if (fs.existsSync(sharedDest)) {
      fs.rmSync(sharedDest, { recursive: true, force: true });
    }
    // Ensure parent directory exists
    const sharedDestParent = path.dirname(sharedDest);
    if (!fs.existsSync(sharedDestParent)) {
      fs.mkdirSync(sharedDestParent, { recursive: true });
    }
    fs.cpSync(sharedSrc, sharedDest, { recursive: true });
  }
} catch (err) {
  // Shared directory doesn't exist or can't be copied - that's OK
  // It might not be needed in all build scenarios
}

// Fix imports in all JS files
const fixedCount = walkDir(distDir);
console.log(`✅ Fixed imports in ${fixedCount} file(s)`);


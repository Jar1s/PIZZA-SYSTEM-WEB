#!/bin/bash
# Fix dist output path for NestJS
if [ -f dist/backend/src/main.js ]; then
  mkdir -p dist
  cp -f dist/backend/src/main.js dist/main.js
  cp -rf dist/backend/src/* dist/ 2>/dev/null || true
fi


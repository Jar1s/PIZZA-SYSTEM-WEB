#!/bin/bash
# Vercel build script - kopíruje shared modul do backendu

set -e

echo "📦 Preparing shared module for Vercel build..."

# Zkopíruj shared do backendu
cp -r ../shared ./shared

# Spusť build
npm run build

# Odstraň kopii (aby se necommitu)
rm -rf ./shared

echo "✅ Build complete"


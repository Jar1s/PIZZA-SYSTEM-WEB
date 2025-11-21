#!/bin/bash

# 🚀 Deployment Fix Script
# Tento script vyčistí duplicitné súbory a pripraví všetko na deployment

set -e

echo "🧹 Čistenie duplicitných shared složiek..."
rm -rf backend/shared
rm -rf frontend/shared
echo "✅ Duplicitné složky odstránené"

echo ""
echo "📦 Pridávanie súborov do gitu..."
git add backend/.gitignore backend/package-lock.json
git add backend/vercel-build.sh
git add DEPLOYMENT-RESCUE-PLAN.md DEPLOYMENT-STATUS.md TEST-DEPLOYMENT.md
git add SUPABASE-CONNECTION*.md SUPABASE-TROUBLESHOOTING.md SUPABASE-PIZZA1.md
git add VERCEL-DEPLOYMENT-PROTECTION.md VERCEL-ENV-QUICK-SETUP.md VERCEL-ENV-VALUES.md
git add DEPLOYMENT-FIX-COMPLETE.md
echo "✅ Súbory pridané do gitu"

echo ""
echo "📝 Status gitu:"
git status --short

echo ""
echo "✅ Hotovo! Teraz:"
echo ""
echo "1. Commit a push:"
echo "   git commit -m 'fix: cleanup duplicate shared folders and add deployment docs'"
echo "   git push origin main"
echo ""
echo "2. Na Vercelu:"
echo "   - Settings → Environment Variables → Pridať DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET"
echo "   - Settings → Deployment Protection → Vypnúť"
echo "   - Settings → General → Clear Build Cache"
echo "   - Deployments → Redeploy (bez cache)"
echo ""
echo "3. Testovať:"
echo "   curl https://your-backend.vercel.app/api/health"
echo ""
echo "📖 Viac detailov: DEPLOYMENT-FIX-COMPLETE.md"


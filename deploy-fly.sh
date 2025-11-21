#!/bin/bash

# 🚀 Deploy Backend na Fly.io
# Tento skript nastaví všetko a deployne backend

set -e

echo "🚀 Deploy Backend na Fly.io"
echo ""

# Skontrolovať, či je fly CLI nainštalovaný
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI nie je nainštalovaný!"
    echo ""
    echo "Inštaluj ho:"
    echo "  curl -L https://fly.io/install.sh | sh"
    echo "  alebo"
    echo "  brew install flyctl"
    echo ""
    exit 1
fi

echo "✅ Fly CLI je nainštalovaný"
echo ""

# Prejsť do backend adresára
cd backend

# Skontrolovať, či je prihlásený
echo "🔐 Kontrolujem prihlásenie..."
if ! fly auth whoami &> /dev/null; then
    echo "❌ Nie si prihlásený do Fly.io!"
    echo ""
    echo "Prihlás sa:"
    echo "  fly auth login"
    echo ""
    exit 1
fi

echo "✅ Prihlásený do Fly.io"
echo ""

# Nastaviť secrets (ak ešte nie sú nastavené)
echo "🔑 Nastavujem secrets..."
echo ""

# Database URL
echo "Nastavujem DATABASE_URL..."
fly secrets set DATABASE_URL="postgresql://postgres.wfzppetogdcgcjvmrgt:011jarko@aws-1-eu-west-1.pooler.supabase.com:5432/postgres" || echo "⚠️  DATABASE_URL už je nastavené"

# JWT Secrets
echo "Nastavujem JWT_SECRET..."
fly secrets set JWT_SECRET="0ax6regUYrpZssgHfuL3WkSAnCWjDgNYx8B/MLuUyTA=" || echo "⚠️  JWT_SECRET už je nastavené"

echo "Nastavujem JWT_REFRESH_SECRET..."
fly secrets set JWT_REFRESH_SECRET="l6lvL9RLeSSXi8CjuEHzElIxzh03lLVpEaBkFuprD64=" || echo "⚠️  JWT_REFRESH_SECRET už je nastavené"

# Node Environment
echo "Nastavujem NODE_ENV..."
fly secrets set NODE_ENV="production" || echo "⚠️  NODE_ENV už je nastavené"

echo ""
echo "✅ Secrets nastavené"
echo ""

# Zobraziť aktuálne secrets
echo "📋 Aktuálne secrets:"
fly secrets list
echo ""

# Deploy
echo "🚀 Spúšťam deploy..."
echo ""
fly deploy

echo ""
echo "✅ Deploy dokončený!"
echo ""
echo "🌐 Backend je dostupný na:"
echo "   https://pizza-ecosystem-api.fly.dev"
echo ""
echo "🧪 Testovať:"
echo "   curl https://pizza-ecosystem-api.fly.dev/api/health"
echo "   curl https://pizza-ecosystem-api.fly.dev/api/tenants/pornopizza"
echo ""


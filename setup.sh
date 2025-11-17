#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Pizza Ecosystem...${NC}\n"

# Check if fnm is installed
if ! command -v fnm &> /dev/null; then
    echo -e "${YELLOW}⚠️  fnm not found. Installing fnm...${NC}"
    curl -fsSL https://fnm.vercel.app/install | bash
    eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" 2>/dev/null || eval "$(fnm env)" 2>/dev/null || true
    echo -e "${GREEN}✅ fnm installed${NC}\n"
fi

# Load fnm
eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" 2>/dev/null || eval "$(fnm env)" 2>/dev/null || true

# Install and use Node 20
if [ -f .nvmrc ]; then
    NODE_VERSION=$(cat .nvmrc)
    echo -e "${GREEN}📦 Installing Node $NODE_VERSION from .nvmrc...${NC}"
    fnm install $NODE_VERSION 2>/dev/null || true
    fnm use $NODE_VERSION
else
    echo -e "${GREEN}📦 Installing Node 20.19.5...${NC}"
    fnm install 20.19.5
    fnm use 20.19.5
fi

# Verify Node version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node version: $NODE_VERSION${NC}\n"

# Backend setup
echo -e "${BLUE}🔧 Setting up backend...${NC}"
cd backend

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found.${NC}"
    echo -e "${YELLOW}   You need to create backend/.env with DATABASE_URL${NC}"
    echo -e "${YELLOW}   Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/pizza_ecosystem\"${NC}\n"
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Install dependencies
echo -e "${GREEN}📦 Installing backend dependencies...${NC}"
rm -rf node_modules dist
npm install

# Generate Prisma client
echo -e "${GREEN}🗄️  Generating Prisma client...${NC}"
npx prisma generate || echo -e "${YELLOW}⚠️  Prisma generate failed - database might not be configured${NC}"

# Frontend setup
echo -e "\n${BLUE}🔧 Setting up frontend...${NC}"
cd ../frontend

# Check for .env.local file
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating default...${NC}"
    cat > .env.local << EOF
# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
else
    echo -e "${GREEN}✅ .env.local found${NC}"
fi

# Install dependencies
echo -e "${GREEN}📦 Installing frontend dependencies...${NC}"
rm -rf node_modules .next
npm install

cd ..

echo -e "\n${GREEN}✅ Setup complete!${NC}\n"
echo -e "${GREEN}To start the project:${NC}"
echo -e "  ${YELLOW}./start.sh${NC}"
echo -e "\n${GREEN}Or manually:${NC}"
echo -e "  ${YELLOW}Terminal 1:${NC} cd backend && npm run start:dev"
echo -e "  ${YELLOW}Terminal 2:${NC} cd frontend && npm run dev"


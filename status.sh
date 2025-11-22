#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📊 Pizza Ecosystem Status${NC}\n"

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "Node version: ${GREEN}$NODE_VERSION${NC}"
    
    # Check if it's Node 20
    if [[ $NODE_VERSION == v20* ]]; then
        echo -e "  ${GREEN}✅ Correct version${NC}"
    else
        echo -e "  ${RED}❌ Wrong version (should be v20.x.x)${NC}"
        if [ -f .nvmrc ]; then
            echo -e "  ${YELLOW}Run: fnm use $(cat .nvmrc)${NC}"
        fi
    fi
else
    echo -e "Node: ${RED}❌ Not found${NC}"
fi

echo ""

# Check backend
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "Backend (port 3000): ${GREEN}✅ Running${NC}"
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Health check OK${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Health check failed${NC}"
    fi
else
    echo -e "Backend (port 3000): ${RED}❌ Not running${NC}"
fi

# Check frontend
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "Frontend (port 3001): ${GREEN}✅ Running${NC}"
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Responding${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Not responding${NC}"
    fi
else
    echo -e "Frontend (port 3001): ${RED}❌ Not running${NC}"
fi

echo ""

# Check .env files
if [ -f backend/.env ]; then
    echo -e "Backend .env: ${GREEN}✅ Found${NC}"
else
    echo -e "Backend .env: ${RED}❌ Missing${NC}"
    echo -e "  ${YELLOW}Copy from backend/.env.example${NC}"
fi

if [ -f frontend/.env.local ]; then
    echo -e "Frontend .env.local: ${GREEN}✅ Found${NC}"
else
    echo -e "Frontend .env.local: ${YELLOW}⚠️  Missing (using defaults)${NC}"
fi

echo ""










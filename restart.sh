#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 Restarting Pizza Ecosystem...${NC}"

# Stop existing servers
echo -e "${YELLOW}🛑 Stopping existing servers...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Load fnm and use Node 20
if command -v fnm &> /dev/null; then
    eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" 2>/dev/null || eval "$(fnm env)" 2>/dev/null || true
    if [ -f .nvmrc ]; then
        NODE_VERSION=$(cat .nvmrc)
        fnm use $NODE_VERSION 2>/dev/null || fnm install $NODE_VERSION && fnm use $NODE_VERSION
    else
        fnm use 20 2>/dev/null || fnm install 20 && fnm use 20
    fi
fi

# Start backend
echo -e "${GREEN}🔧 Starting backend...${NC}"
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo -e "${GREEN}⏳ Waiting for backend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend running!${NC}"
        break
    fi
    sleep 1
done

# Start frontend
echo -e "${GREEN}🔧 Starting frontend...${NC}"
cd frontend
rm -rf .next
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Restart complete!${NC}"
echo -e "${GREEN}📱 Frontend:${NC} http://localhost:3001"
echo -e "${GREEN}🔧 Backend:${NC} http://localhost:3000"


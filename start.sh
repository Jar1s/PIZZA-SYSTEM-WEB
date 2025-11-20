#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in background mode (for AI calls)
BACKGROUND_MODE=${1:-false}

if [ "$BACKGROUND_MODE" != "true" ]; then
    echo -e "${GREEN}🚀 Starting Pizza Ecosystem...${NC}"
fi

# Load fnm and use Node 20
if command -v fnm &> /dev/null; then
    eval "$(/opt/homebrew/opt/fnm/bin/fnm env)" 2>/dev/null || eval "$(fnm env)" 2>/dev/null || true
    if [ -f .nvmrc ]; then
        NODE_VERSION=$(cat .nvmrc)
        echo -e "${GREEN}📦 Using Node version from .nvmrc: $NODE_VERSION${NC}"
        fnm use $NODE_VERSION 2>/dev/null || fnm install $NODE_VERSION && fnm use $NODE_VERSION
    else
        echo -e "${YELLOW}⚠️  .nvmrc not found, using Node 20${NC}"
        fnm use 20 2>/dev/null || fnm install 20 && fnm use 20
    fi
else
    echo -e "${YELLOW}⚠️  fnm not found. Please install it: curl -fsSL https://fnm.vercel.app/install | bash${NC}"
    echo -e "${YELLOW}   Or ensure Node 20 is active manually${NC}"
fi

# Verify Node version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node version: $NODE_VERSION${NC}"

# Check if backend is already running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend already running on port 3000${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${GREEN}🔧 Starting backend...${NC}"
    cd backend
    
    # Check if .env exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env file not found in backend/${NC}"
        echo -e "${YELLOW}   Backend might not work without database configuration${NC}"
    fi
    
    # Ensure shared module exists before building (if dist exists)
    if [ -d "dist" ] && [ ! -f "dist/shared/index.js" ]; then
        echo -e "${YELLOW}⚠️  Shared module missing, building it first...${NC}"
        node build-shared.js || {
            echo -e "${RED}❌ Failed to build shared module${NC}"
            exit 1
        }
    fi
    
    # Build and start backend in background
    npm run start:dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo -e "${GREEN}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is running!${NC}"
            BACKEND_RUNNING=true
            break
        fi
        sleep 1
    done
    
    if [ "$BACKEND_RUNNING" != "true" ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log for errors${NC}"
        echo -e "${YELLOW}   You can try: cd backend && npm run start:dev${NC}"
    fi
fi

# Check if frontend is already running
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend already running on port 3001${NC}"
else
    echo -e "${GREEN}🔧 Starting frontend...${NC}"
    cd frontend
    
    # Clear Next.js cache
    rm -rf .next
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}⚠️  .env.local not found, using defaults${NC}"
    fi
    
    # Start frontend in background on port 3001
    PORT=3001 npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    echo -e "${GREEN}✅ Frontend is starting...${NC}"
fi

if [ "$BACKGROUND_MODE" != "true" ]; then
    echo -e "\n${GREEN}✅ Project is running!${NC}"
    echo -e "${GREEN}📱 Frontend:${NC} http://localhost:3001"
    echo -e "${GREEN}🔧 Backend:${NC} http://localhost:3000"
    echo -e "${GREEN}📊 Health:${NC} http://localhost:3000/api/health"
    echo -e "\n${YELLOW}Logs:${NC}"
    echo -e "  Backend:  tail -f backend.log"
    echo -e "  Frontend: tail -f frontend.log"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}"

    # Cleanup on exit
    cleanup() {
        echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        # Kill by port if PIDs don't work
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        exit
    }

    trap cleanup INT TERM

    # Wait for user interrupt
    wait
else
    # Background mode - just start and exit
    echo -e "${GREEN}✅ Servers started in background${NC}"
    echo -e "${GREEN}📱 Frontend:${NC} http://localhost:3001"
    echo -e "${GREEN}🔧 Backend:${NC} http://localhost:3000"
fi


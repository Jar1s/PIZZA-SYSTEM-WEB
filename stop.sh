#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping Pizza Ecosystem...${NC}"

# Kill backend
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}Stopping backend (port 3000)...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
else
    echo -e "${YELLOW}Backend not running${NC}"
fi

# Kill frontend
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}Stopping frontend (port 3001)...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
else
    echo -e "${YELLOW}Frontend not running${NC}"
fi

echo -e "${GREEN}✅ All servers stopped${NC}"









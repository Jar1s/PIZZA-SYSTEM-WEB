#!/bin/bash
# Start backend locally
cd "$(dirname "$0")"

# Ensure build is up to date
npm run build

# Start the server
echo "🚀 Starting backend server on http://localhost:3000"
PORT=3000 node dist/main.js

















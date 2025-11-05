#!/bin/bash

# Script to push to GitHub
# Usage: ./push-to-github.sh https://github.com/username/repo-name.git

if [ -z "$1" ]; then
    echo "❌ Error: Please provide GitHub repository URL"
    echo ""
    echo "Usage:"
    echo "  ./push-to-github.sh https://github.com/username/repo-name.git"
    echo ""
    echo "Or create a new repository first:"
    echo "  → https://github.com/new"
    exit 1
fi

REPO_URL=$1

echo "🚀 Pushing to GitHub..."
echo "📦 Repository: $REPO_URL"
echo ""

# Add remote
echo "1️⃣  Adding remote..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# Set branch to main
echo "2️⃣  Setting branch to main..."
git branch -M main

# Push
echo "3️⃣  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is now on GitHub!"
    echo "🌐 Visit: $REPO_URL"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "   - Is the repository created on GitHub?"
    echo "   - Do you have access to the repository?"
    echo "   - Are your GitHub credentials configured?"
fi


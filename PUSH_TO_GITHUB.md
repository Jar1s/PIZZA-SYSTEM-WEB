# 🚀 Push to GitHub - Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `pizza-platform` (or your choice)
3. Description: "Multi-tenant pizza ordering platform"
4. Choose: **Private** or **Public**
5. **DO NOT** initialize with README (we already have one)
6. Click **"Create repository"**

## Step 2: Add Remote and Push

Copy and run these commands:

```bash
cd "/Users/jaroslav/Documents/CODING/WEBY miro "

# Add remote (replace YOUR_USERNAME and YOUR_REPO with your actual values)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Verify

Visit: `https://github.com/YOUR_USERNAME/YOUR_REPO`

You should see all your files!

---

## Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## Quick Command (Copy-Paste Ready)

After creating the repo, replace the URL and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git && git branch -M main && git push -u origin main
```

---

**Note:** You'll be prompted for GitHub credentials on first push.

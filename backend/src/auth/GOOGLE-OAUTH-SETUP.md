# 🔐 Google OAuth Setup Guide

## ✅ Implementation Complete

Google OAuth has been fully implemented and is ready to use once credentials are configured.

## 📋 Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** (or **Google Identity Services**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (for public use)
   - App name: Your Pizza App Name
   - Authorized domains: your-domain.com
   - Scopes: email, profile, openid
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: Pizza App OAuth Client
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/customer/google/callback`
     - Production: `https://your-backend-domain.com/api/auth/customer/google/callback`

### 2. Get Your Credentials

After creating the OAuth client, you'll get:
- **Client ID** (e.g., `123456789-abc.apps.googleusercontent.com`)
- **Client Secret** (e.g., `GOCSPX-abc123...`)

### 3. Add Environment Variables

Add these to your `.env` file in the backend:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/customer/google/callback

# URLs (optional - defaults provided)
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

### 4. Production Setup

For production, update:
```env
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/auth/customer/google/callback
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔄 How It Works

### Flow:
1. User clicks "Sign in with Google" button
2. Frontend redirects to `/api/auth/customer/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes the app
5. Google redirects back to `/api/auth/customer/google/callback?code=...`
6. Backend exchanges code for ID token
7. Backend verifies token and extracts user info
8. Backend creates/updates customer account
9. If phone not verified → redirect to SMS verification
10. If phone verified → redirect to returnUrl or home

## 🧪 Testing

### Without Credentials (Current State):
- Clicking "Sign in with Google" will redirect to Google
- But will fail if credentials not configured
- Error will be shown: "Google OAuth is not configured"

### With Credentials:
1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Restart backend server
3. Click "Sign in with Google"
4. Should redirect to Google OAuth consent screen
5. After authorization, should redirect back and log in

## 📝 Notes

- **Development**: Use `http://localhost:3000` for redirect URI
- **Production**: Use your production backend URL
- **Scopes**: email, profile, openid (already configured)
- **State Parameter**: Used to preserve returnUrl (e.g., /checkout)
- **SMS Verification**: Still required after OAuth login if phone not verified

## 🔒 Security

- Client Secret should **NEVER** be exposed in frontend
- Use environment variables for all credentials
- In production, use HTTPS for all OAuth redirects
- Validate redirect URIs match exactly in Google Console

## ✅ Status

- ✅ Google OAuth redirect implemented
- ✅ Google OAuth callback implemented
- ✅ Token verification implemented
- ✅ User creation/update implemented
- ✅ SMS verification integration
- ✅ ReturnUrl support
- ⚠️ **Requires Google OAuth credentials to work**

## 🚀 Next Steps

1. Get Google OAuth credentials from Google Cloud Console
2. Add credentials to `.env` file
3. Restart backend server
4. Test Google OAuth login

---

**Ready to use once credentials are configured!** 🎉


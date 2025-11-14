# 🍎 Apple OAuth Setup Guide

## ✅ Implementation Complete

Apple OAuth (Sign in with Apple) has been fully implemented and is ready to use once credentials are configured.

## 📋 Setup Instructions

### 1. Create Apple Developer Account & App

1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Sign in with your Apple Developer account
3. Go to **Certificates, Identifiers & Profiles**
4. Create a new **App ID**:
   - Description: Your Pizza App
   - Bundle ID: `com.yourcompany.pizzaapp` (must be unique)
   - Enable **Sign In with Apple** capability
5. Create a new **Service ID**:
   - Description: Pizza App Web Service
   - Identifier: `com.yourcompany.pizzaapp.web` (must be unique)
   - Enable **Sign In with Apple**
   - Configure **Return URLs**:
     - Development: `http://localhost:3000/api/auth/customer/apple/callback`
     - Production: `https://your-backend-domain.com/api/auth/customer/apple/callback`

### 2. Create Key for Sign in with Apple

1. Go to **Keys** section in Apple Developer Console
2. Click **+** to create a new key
3. Name: "Sign in with Apple Key"
4. Enable **Sign in with Apple**
5. Configure: Select your App ID
6. Click **Continue** → **Register**
7. **Download the key file** (`.p8` file) - **You can only download it once!**
8. Note the **Key ID** (shown after creation)

### 3. Get Your Team ID

1. In Apple Developer Console, go to **Membership**
2. Copy your **Team ID** (10-character string)

### 4. Add Environment Variables

Add these to your `.env` file in the backend:

```env
# Apple OAuth
APPLE_CLIENT_ID=com.yourcompany.pizzaapp.web  # Your Service ID
APPLE_SERVICE_ID=com.yourcompany.pizzaapp.web  # Same as CLIENT_ID (for compatibility)
APPLE_TEAM_ID=ABC123DEFG  # Your 10-character Team ID
APPLE_KEY_ID=XYZ789ABC  # Your Key ID from step 2
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...\n-----END PRIVATE KEY-----"  # Content of .p8 file
APPLE_REDIRECT_URI=http://localhost:3000/api/auth/customer/apple/callback

# URLs (optional - defaults provided)
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

**Important Notes:**
- `APPLE_PRIVATE_KEY` should be the **entire content** of the `.p8` file, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Replace `\n` with actual newlines or use the format shown above
- The private key can be stored as a single-line string with `\n` characters

### 5. Production Setup

For production, update:
```env
APPLE_REDIRECT_URI=https://your-backend-domain.com/api/auth/customer/apple/callback
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔄 How It Works

### Flow:
1. User clicks "Sign in with Apple" button
2. Frontend redirects to `/api/auth/customer/apple`
3. Backend redirects to Apple OAuth consent screen
4. User authorizes the app
5. Apple POSTs back to `/api/auth/customer/apple/callback` with `code` and `user` data
6. Backend exchanges `code` for `id_token` using client secret (JWT)
7. Backend verifies `id_token` and extracts user info
8. Backend creates/updates customer account
9. If phone not verified → redirect to SMS verification
10. If phone verified → redirect to returnUrl or home

## 🧪 Testing

### Without Credentials (Current State):
- Clicking "Sign in with Apple" will show error: "Apple OAuth is not configured"

### With Credentials:
1. Set all Apple OAuth environment variables in `.env`
2. Restart backend server
3. Click "Sign in with Apple"
4. Should redirect to Apple OAuth consent screen
5. After authorization, should redirect back and log in

## 📝 Notes

- **Development**: Use `http://localhost:3000` for redirect URI
- **Production**: Use your production backend URL
- **Scopes**: `name`, `email` (already configured)
- **State Parameter**: Used to preserve returnUrl (e.g., /checkout)
- **SMS Verification**: Still required after OAuth login if phone not verified
- **Email Privacy**: Apple may hide user's email - we use private relay email as fallback
- **Name**: Only provided on first login - stored in `user` parameter during callback

## 🔒 Security

- Private Key should **NEVER** be exposed in frontend or committed to git
- Use environment variables for all credentials
- In production, use HTTPS for all OAuth redirects
- Validate redirect URIs match exactly in Apple Developer Console
- Private key file (`.p8`) can only be downloaded once - store it securely

## ⚠️ Important Differences from Google OAuth

1. **Callback Method**: Apple uses **POST** (not GET) for callback
2. **Client Secret**: Apple uses a **JWT token** (not a static string) generated from private key
3. **Email Privacy**: Apple may hide user's email - handle `null` email gracefully
4. **Name**: Only provided on first login - may need to request separately

## ✅ Status

- ✅ Apple OAuth redirect implemented
- ✅ Apple OAuth callback implemented (POST)
- ✅ Client secret generation (JWT) implemented
- ✅ Token verification implemented
- ✅ User creation/update implemented
- ✅ SMS verification integration
- ✅ ReturnUrl support
- ⚠️ **Requires Apple OAuth credentials to work**

## 🚀 Next Steps

1. Get Apple Developer account (if you don't have one)
2. Create App ID and Service ID in Apple Developer Console
3. Create Key for Sign in with Apple
4. Add credentials to `.env` file
5. Restart backend server
6. Test Apple OAuth login

---

**Ready to use once credentials are configured!** 🎉



# 🔐 Render.com SSL Certificate Fix

## Problem

The frontend is experiencing SSL certificate errors when trying to connect to the Render.com backend:

```
GET https://pizza-system-web.onrender.com/api/tenants/pornopizza 
net::ERR_CERT_AUTHORITY_INVALID
```

This error indicates that the SSL certificate for the Render.com service is not valid or not properly configured.

## Root Cause

Render.com services should automatically have SSL certificates, but sometimes:
1. The certificate hasn't been generated yet
2. There's a certificate chain issue
3. The service needs to be redeployed to refresh the certificate

## Solution

### Option 1: Redeploy the Service (Recommended)

1. **Go to Render.com Dashboard**
   - Navigate to: https://dashboard.render.com/web/srv-d4gfs2khg0os73fou7c0

2. **Manual Deploy**
   - Click on "Manual Deploy" → "Deploy latest commit"
   - This will trigger a new deployment and regenerate the SSL certificate

3. **Wait for Deployment**
   - Wait 5-10 minutes for the deployment to complete
   - The SSL certificate should be automatically regenerated

### Option 2: Check Service Settings

1. **Verify Service Configuration**
   - Go to Render Dashboard → Your Service → Settings
   - Ensure the service is set to use HTTPS (default)
   - Check that there are no custom SSL configurations that might be causing issues

2. **Check Service URL**
   - Verify the service URL is: `https://pizza-system-web.onrender.com`
   - Make sure it's using HTTPS, not HTTP

### Option 3: Verify SSL Certificate

1. **Test SSL Certificate**
   ```bash
   openssl s_client -connect pizza-system-web.onrender.com:443 -servername pizza-system-web.onrender.com
   ```

2. **Check Certificate Online**
   - Visit: https://www.ssllabs.com/ssltest/analyze.html?d=pizza-system-web.onrender.com
   - This will show you the certificate status and any issues

### Option 4: Contact Render Support

If the above solutions don't work:

1. **Contact Render Support**
   - Go to: https://render.com/docs/support
   - Explain that your service SSL certificate is showing `ERR_CERT_AUTHORITY_INVALID`
   - Provide your service ID: `srv-d4gfs2khg0os73fou7c0`

2. **Provide Details**
   - Service URL: `https://pizza-system-web.onrender.com`
   - Error: `ERR_CERT_AUTHORITY_INVALID`
   - Service ID: `srv-d4gfs2khg0os73fou7c0`

## Verification

After applying the fix:

1. **Test the Backend**
   ```bash
   curl -I https://pizza-system-web.onrender.com/api/health
   ```
   Should return `200 OK` without SSL errors

2. **Test from Browser**
   - Open: https://pizza-system-web.onrender.com/api/health
   - Should show `{"status":"ok"}` without certificate warnings

3. **Test Frontend**
   - The frontend should now be able to connect to the backend
   - No more `ERR_CERT_AUTHORITY_INVALID` errors

## Temporary Workaround (Development Only)

⚠️ **WARNING: Only for development, NOT for production!**

If you need to test locally while waiting for the SSL fix:

1. **Use HTTP instead of HTTPS** (only for local development)
   - Set `NEXT_PUBLIC_API_URL=http://pizza-system-web.onrender.com` in `.env.local`
   - Note: This may not work if Render blocks HTTP requests

2. **Use a proxy** (for local development only)
   - Set up a local proxy that handles SSL verification
   - Not recommended for production

## Prevention

To prevent this issue in the future:

1. **Always use HTTPS** for production services
2. **Monitor SSL certificate expiration** (Render handles this automatically)
3. **Test SSL certificates** after deployments
4. **Keep Render service updated** to ensure latest SSL configurations

## Related Files

- `frontend/lib/api.ts` - API client with SSL error handling
- `frontend/lib/api-with-retry.ts` - Retry logic with SSL error detection
- `frontend/.env.local` - Environment configuration

## Status

- [ ] SSL certificate issue identified
- [ ] Service redeployed
- [ ] SSL certificate verified
- [ ] Frontend connection tested
- [ ] Issue resolved

---

**Last Updated:** 2025-12-02
**Service ID:** srv-d4gfs2khg0os73fou7c0
**Service URL:** https://pizza-system-web.onrender.com


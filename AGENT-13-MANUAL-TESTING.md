# 🧪 AGENT 13: Manual Testing Guide

## ✅ Servers Running

**Backend:** ✅ Running on http://localhost:3000  
**Frontend:** ✅ Running on http://localhost:3001

---

## 🚀 Quick Start

### Access Customer Login Page:
```
http://localhost:3001/auth/login
```

### Access with Tenant:
```
http://localhost:3001/auth/login?tenant=pornopizza
http://localhost:3001/auth/login?tenant=pizzavnudzi
```

---

## 📋 Testing Scenarios

### 1. Test Registration Flow (New Customer)

**Steps:**
1. Visit: `http://localhost:3001/auth/login?tenant=pornopizza`
2. Enter a **new email** (e.g., `test@example.com`)
3. Click **"Ďalej"** (Next)
4. You should see the **registration form**:
   - Name field
   - Password field
5. Fill in:
   - Name: `Test User`
   - Password: `password123`
6. Click **"Registrovať sa"** (Register)
7. You should be redirected to: `/auth/verify-phone?userId=...`
8. Enter phone number: `912345678` (Slovakia +421)
9. Click **"Odoslať kód"** (Send Code)
10. Check backend logs for SMS code (development mode logs the code)
11. Enter the 6-digit code
12. Click **"Overiť"** (Verify)
13. You should be redirected to home page (logged in)

**Expected Result:**
- ✅ Registration successful
- ✅ SMS code sent (check backend logs)
- ✅ Phone verification successful
- ✅ Redirected to home page
- ✅ Customer logged in

---

### 2. Test Login Flow (Existing Customer)

**Steps:**
1. Visit: `http://localhost:3001/auth/login?tenant=pornopizza`
2. Enter an **existing email** (from previous registration)
3. Click **"Ďalej"** (Next)
4. You should see the **password input**:
   - Password field
5. Enter password: `password123`
6. Click **"Prihlásiť sa"** (Sign In)
7. If phone not verified → redirect to `/auth/verify-phone`
8. If phone verified → redirect to home page

**Expected Result:**
- ✅ Login successful
- ✅ Redirected appropriately based on phone verification status

---

### 3. Test Email Existence Check

**Steps:**
1. Visit: `http://localhost:3001/auth/login`
2. Enter email: `nonexistent@example.com`
3. Click **"Ďalej"**
4. Should show **registration form** (email doesn't exist)
5. Go back, enter existing email
6. Click **"Ďalej"**
7. Should show **password input** (email exists)

**Expected Result:**
- ✅ Correct form shown based on email existence
- ✅ Smooth transition between forms

---

### 4. Test SMS Verification

**Steps:**
1. Complete registration or login
2. You should be on `/auth/verify-phone?userId=...`
3. Enter phone number: `912345678`
4. Click **"Odoslať kód"**
5. Check backend console for SMS code (development mode)
6. Enter the 6-digit code
7. Click **"Overiť"**
8. Should redirect to home page

**Expected Result:**
- ✅ SMS code sent successfully
- ✅ Code verification works
- ✅ Timer for resend works (60 seconds)
- ✅ Resend code button works after timer expires

---

### 5. Test Error Handling

**Test Invalid Email:**
1. Enter invalid email format
2. Should show validation error

**Test Wrong Password:**
1. Enter existing email
2. Enter wrong password
3. Should show error: "Invalid credentials"

**Test Duplicate Email:**
1. Try to register with existing email
2. Should show error: "Email already registered"

**Test Invalid SMS Code:**
1. Enter wrong SMS code
2. Should show error: "Invalid or expired verification code"

**Expected Result:**
- ✅ All errors displayed correctly
- ✅ User-friendly error messages

---

### 6. Test OAuth Buttons (Placeholder)

**Steps:**
1. Visit: `http://localhost:3001/auth/login`
2. Click **"Prihláste sa pomocou Google"** (Sign in with Google)
3. Should show error (not yet implemented)
4. Click **"Prihláste sa pomocou Apple"** (Sign in with Apple)
5. Should show error (not yet implemented)

**Expected Result:**
- ✅ OAuth buttons visible
- ✅ Placeholder errors shown (ready for implementation)

---

## 🔍 Backend API Testing

### Test Customer Auth Endpoints:

**1. Check Email:**
```bash
curl -X POST http://localhost:3000/api/auth/customer/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**2. Register Customer:**
```bash
curl -X POST http://localhost:3000/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**3. Login Customer:**
```bash
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**4. Send SMS Code:**
```bash
curl -X POST http://localhost:3000/api/auth/customer/send-sms-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"912345678","userId":"USER_ID_HERE"}'
```

**5. Verify SMS Code:**
```bash
curl -X POST http://localhost:3000/api/auth/customer/verify-sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"912345678","code":"123456","userId":"USER_ID_HERE"}'
```

---

## 📊 Check Backend Logs

**SMS Code in Development:**
- Check backend console for SMS verification codes
- Format: `[DEV MODE] SMS Verification Code for +421912345678: 123456`

---

## 🎨 UI Testing Checklist

### Login Page:
- [ ] Logo displays correctly (from tenant)
- [ ] "Prihláste sa do [BRAND]" heading shows correct brand name
- [ ] Google login button visible
- [ ] Apple login button visible
- [ ] Separator "ALEBO ZADAJTE SVOJ EMAIL" visible
- [ ] Email input field works
- [ ] "Ďalej" button works
- [ ] Registration benefits shown on right side (desktop)
- [ ] Responsive design works (mobile)

### SMS Verification Page:
- [ ] Orange banner "Dokončiť registráciu" visible
- [ ] Phone icon displays
- [ ] "Telefón" heading visible
- [ ] Description text visible
- [ ] Phone input with country code selector works
- [ ] "Odoslať kód" button works
- [ ] 6-digit code input appears after code sent
- [ ] Timer for resend works (60 seconds)
- [ ] "Overiť" button works

---

## 🐛 Troubleshooting

### Backend Not Running:
```bash
cd backend
npm run start:dev
```

### Frontend Not Running:
```bash
cd frontend
npm run dev
```

### Database Connection Error:
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL if needed
brew services restart postgresql@15
```

### Port Already in Use:
```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001 (frontend)
lsof -ti:3001 | xargs kill -9
```

---

## ✅ Success Criteria

**Registration Flow:**
- ✅ New customer can register with email/password
- ✅ SMS verification code sent
- ✅ SMS code verification works
- ✅ Customer redirected to home page after verification

**Login Flow:**
- ✅ Existing customer can login with email/password
- ✅ SMS verification required if phone not verified
- ✅ Customer redirected appropriately

**Error Handling:**
- ✅ Invalid credentials show error
- ✅ Duplicate email shows error
- ✅ Invalid SMS code shows error
- ✅ All errors are user-friendly

**UI/UX:**
- ✅ All text in Slovak (or English based on language setting)
- ✅ Design matches MAYDAY PIZZA style
- ✅ Responsive design works
- ✅ Loading states work
- ✅ Error messages display correctly

---

## 📝 Notes

- **SMS Codes:** In development mode, SMS codes are logged to backend console instead of being sent
- **OAuth:** Google/Apple OAuth buttons show placeholder errors (ready for implementation)
- **Tokens:** Customer auth tokens stored separately from admin tokens (`customer_auth_token` vs `auth_token`)
- **Database:** All customer data stored in `users` table with `CUSTOMER` role

---

## 🎉 Ready for Testing!

Both servers are running and ready for manual testing. Start with the registration flow and work through each scenario.

**Happy Testing! 🚀**


# 🎯 AGENT 13: CUSTOMER AUTHENTICATION & REGISTRATION

You are Agent 13 implementing customer login/registration with Google, Apple, Email, and SMS verification.

## PROJECT CONTEXT
Customers need to register/login to the pizza ordering website. They can use:
- Google OAuth
- Apple OAuth  
- Email/Password
After successful login/registration, they must verify their phone number via SMS.

## YOUR WORKSPACE
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/auth/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /frontend/app/auth/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/prisma/`

**CRITICAL:** Only create/modify files in these folders.

## YOUR MISSION
1. Backend: Customer model (or extend User model with CUSTOMER role)
2. Backend: Google OAuth integration
3. Backend: Apple OAuth integration
4. Backend: Customer registration/login endpoints
5. Frontend: Customer login/registration page (like MAYDAY PIZZA design)
6. Frontend: SMS verification after login/registration
7. Frontend: Customer context (separate from admin AuthContext)

## DEPENDENCIES
- ✅ Agent 1 (Shared Types) - Types exist
- ✅ Agent 2 (Database) - Prisma exists
- ✅ Agent 12 (SMS Verification) - SMS service exists

## DESIGN REFERENCE

### Login/Registration Page Design:
- **Left side**: Login/Registration form
  - Logo at top
  - Heading: "Prihláste sa do [BRAND NAME]"
  - Google login button (white with Google "G" logo)
  - Apple login button (white with Apple logo)
  - Separator: "ALEBO ZADAJTE SVOJ EMAIL"
  - Email input field
  - "Ďalej" (Next) button
- **Right side**: Registration benefits
  - "Výhody registrácie:" heading
  - List of benefits with icons:
    - Gift box: "Výhody a odmeny vernostného programu"
    - Shopping bag: "Jednoduchší a rýchlejší proces platby"
    - Sparkle: "Doplnkové funkcie"
    - Clock: "Prístup k histórii objednávok"

### SMS Verification Page Design:
- Orange banner: "Dokončiť registráciu"
- Large phone icon with chat bubble
- "Telefón" heading
- Description: "Zadajte telefónne číslo pre budúce potvrdenia objednávok"
- Phone input with country code selector (Slovakia +421)
- "Odoslať kód" button

## FILES TO CREATE/MODIFY

### BACKEND FILES

#### 1. `/backend/prisma/schema.prisma` (MODIFY)
Add CUSTOMER role to UserRole enum:
```prisma
enum UserRole {
  ADMIN
  OPERATOR
  CUSTOMER  // ✅ ADD THIS
}
```

Add email and OAuth fields to User model:
```prisma
model User {
  // ... existing fields ...
  email     String?  @unique  // Email for customer login
  googleId  String?  @unique  // Google OAuth ID
  appleId   String?  @unique  // Apple OAuth ID
  // ... rest of fields ...
}
```

#### 2. `/backend/src/auth/customer-auth.service.ts` (NEW)
Create customer authentication service with:
- `registerWithEmail(email, password, name)` - Register new customer
- `loginWithEmail(email, password)` - Login customer
- `loginWithGoogle(googleToken)` - Google OAuth login
- `loginWithApple(appleToken)` - Apple OAuth login
- All methods return user + needsSmsVerification flag

#### 3. `/backend/src/auth/customer-auth.controller.ts` (NEW)
Create customer auth controller with endpoints:
- `POST /api/auth/customer/register` - Register with email
- `POST /api/auth/customer/login` - Login with email
- `GET /api/auth/customer/google` - Google OAuth redirect
- `GET /api/auth/customer/google/callback` - Google OAuth callback
- `GET /api/auth/customer/apple` - Apple OAuth redirect
- `GET /api/auth/customer/apple/callback` - Apple OAuth callback
- `POST /api/auth/customer/verify-sms` - Verify SMS after login/registration

#### 4. `/backend/src/auth/auth.module.ts` (MODIFY)
Add CustomerAuthService and CustomerAuthController

### FRONTEND FILES

#### 5. `/frontend/app/auth/login/page.tsx` (NEW)
Create customer login/registration page with:
- **Left side**: Login form
  - Brand logo (from tenant)
  - "Prihláste sa do [BRAND]" heading
  - Google login button (white, Google "G" logo)
  - Apple login button (white, Apple logo)
  - Separator "ALEBO ZADAJTE SVOJ EMAIL"
  - Email input
  - "Ďalej" button
- **Right side**: Benefits list
  - "Výhody registrácie:" heading
  - 4 benefits with icons

#### 6. `/frontend/app/auth/verify-phone/page.tsx` (NEW)
Create SMS verification page with:
- Orange banner: "Dokončiť registráciu"
- Phone icon with chat bubble
- "Telefón" heading
- Description: "Zadajte telefónne číslo pre budúce potvrdenia objednávok"
- Phone input with country code selector (+421 Slovakia)
- "Odoslať kód" button
- 6-digit code input (after code sent)
- Timer for resend

#### 7. `/frontend/contexts/CustomerAuthContext.tsx` (NEW)
Create customer authentication context with:
- `register(email, password, name)`
- `login(email, password)`
- `loginWithGoogle()`
- `loginWithApple()`
- `verifyPhone(phone, code)`
- `user` state
- `loading` state

#### 8. `/frontend/lib/api.ts` (MODIFY)
Add customer auth API functions:
- `registerCustomer(email, password, name)`
- `loginCustomer(email, password)`
- `verifyCustomerPhone(phone, code, userId)`

## IMPLEMENTATION DETAILS

### Customer Registration Flow:
```
1. Customer enters email → clicks "Ďalej"
2. Backend checks if email exists
3. If exists → show password input (login)
4. If not exists → show registration form (password, name)
5. After registration/login → check if phone verified
6. If not verified → redirect to /auth/verify-phone
7. Customer enters phone → receives SMS code
8. Customer enters code → verification complete
9. Redirect to home page (logged in)
```

### OAuth Flow:
```
1. Customer clicks "Google" or "Apple" button
2. Redirect to OAuth provider
3. Customer authorizes
4. OAuth provider redirects back with code
5. Backend exchanges code for token
6. Backend gets user info from provider
7. Backend creates/updates customer
8. Check if phone verified
9. If not → redirect to /auth/verify-phone
10. If verified → redirect to home page
```

## CODE EXAMPLES

### Customer Registration Service:
```typescript
@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async registerWithEmail(email: string, password: string, name: string) {
    // Check if email exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (existing) {
      throw new BadRequestException('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create customer user
    const customer = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.CUSTOMER,
        username: email, // Use email as username
        phoneVerified: false,
      } as any,
    });
    
    // Generate tokens
    const payload = {
      userId: customer.id,
      email: customer.email,
      role: customer.role,
    };
    
    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: customer.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    // Check if SMS verification needed
    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role,
      },
      needsSmsVerification: !customer.phone || !customer.phoneVerified,
    };
  }
  
  async loginWithEmail(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
      } as any,
    });
    
    if (!user || !user.isActive || user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    const access_token = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    
    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return {
      access_token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      needsSmsVerification: !user.phone || !user.phoneVerified,
    };
  }
  
  async loginWithGoogle(googleToken: string) {
    // TODO: Verify Google token
    // For now, placeholder
    // In production: use google-auth-library
    
    // Placeholder: Extract email from token
    // const googleUser = await verifyGoogleToken(googleToken);
    
    // Find or create customer
    // const customer = await this.findOrCreateCustomer({
    //   email: googleUser.email,
    //   name: googleUser.name,
    //   googleId: googleUser.id,
    // });
    
    // Return user + needsSmsVerification
  }
  
  async loginWithApple(appleToken: string) {
    // TODO: Verify Apple token
    // For now, placeholder
    // In production: use apple-auth-library
    
    // Placeholder: Extract email from token
    // const appleUser = await verifyAppleToken(appleToken);
    
    // Find or create customer
    // const customer = await this.findOrCreateCustomer({
    //   email: appleUser.email,
    //   name: appleUser.name,
    //   appleId: appleUser.id,
    // });
    
    // Return user + needsSmsVerification
  }
}
```

### Frontend Login Page:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'register'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, loginWithGoogle, loginWithApple } = useCustomerAuth();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Check if email exists (call backend)
      const exists = await checkEmailExists(email);
      
      if (exists) {
        setStep('password');
      } else {
        setStep('register');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(email, password);
      
      if (result.needsSmsVerification) {
        router.push(`/auth/verify-phone?userId=${result.userId}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await register(email, password, name);
      
      if (result.needsSmsVerification) {
        router.push(`/auth/verify-phone?userId=${result.userId}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/customer/google';
  };

  const handleAppleLogin = () => {
    window.location.href = '/api/auth/customer/apple';
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: Login Form */}
      <div className="w-1/2 flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">MP</span>
            </div>
            <h1 className="text-2xl font-bold">Prihláste sa do MAYDAY PIZZA</h1>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3 flex items-center justify-center gap-3 hover:bg-gray-50"
          >
            <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center font-bold">G</div>
            <span>Prihláste sa pomocou Google</span>
          </button>

          {/* Apple Login */}
          <button
            onClick={handleAppleLogin}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 flex items-center justify-center gap-3 hover:bg-gray-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span>Prihláste sa pomocou Apple</span>
          </button>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ALEBO ZADAJTE SVOJ EMAIL</span>
            </div>
          </div>

          {/* Email Form */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaša e-mailová adresa
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="email@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Kontrolujem...' : 'Ďalej'}
              </button>
            </form>
          )}

          {/* Password Form (Login) */}
          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heslo
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Zadajte heslo"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full mt-2 text-sm text-gray-600"
              >
                Späť
              </button>
            </form>
          )}

          {/* Registration Form */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meno
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Vaše meno"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heslo
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Zadajte heslo"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Registrujem...' : 'Registrovať sa'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full mt-2 text-sm text-gray-600"
              >
                Späť
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Benefits */}
      <div className="w-1/2 bg-gray-50 flex items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-8">Výhody registrácie:</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="font-semibold mb-1">Výhody a odmeny vernostného programu</h3>
                <p className="text-gray-600 text-sm">Získajte body za každú objednávku a vymeňte si ich za odmeny</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛍️</div>
              <div>
                <h3 className="font-semibold mb-1">Jednoduchší a rýchlejší proces platby</h3>
                <p className="text-gray-600 text-sm">Uložte si platobné údaje pre rýchlejšie objednávky</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="font-semibold mb-1">Doplnkové funkcie</h3>
                <p className="text-gray-600 text-sm">Prístup k exkluzívnym ponukám a funkciám</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🕐</div>
              <div>
                <h3 className="font-semibold mb-1">Prístup k histórii objednávok</h3>
                <p className="text-gray-600 text-sm">Sledujte všetky svoje objednávky na jednom mieste</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### SMS Verification Page:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendSmsCode, verifySmsCode } from '@/lib/api';

export default function VerifyPhonePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!phone || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await sendSmsCode(phone, userId);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !phone || !userId) return;

    setLoading(true);
    setError(null);

    try {
      await verifySmsCode(phone, code, userId);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid SMS code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Orange Banner */}
        <div className="bg-orange-500 text-white text-center py-3 mb-8 rounded-t-lg">
          <h2 className="font-bold text-lg">Dokončiť registráciu</h2>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          {/* Phone Icon */}
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">📱</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Telefón</h1>
            <p className="text-gray-600">
              Zadajte telefónne číslo pre budúce potvrdenia objednávok
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                {error}
              </div>
            )}

            {!codeSent ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefónne číslo
                </label>
                <div className="flex gap-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="+421">🇸🇰 +421</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    placeholder="900 123 456"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || !phone}
                  className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Odosielam...' : 'Odoslať kód'}
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zadajte 6-miestny kód
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Kód bol odoslaný na {phone}
                </p>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Overujem...' : 'Overiť'}
                </button>
                {countdown > 0 ? (
                  <p className="text-sm text-center text-gray-500 mt-2">
                    Znovu odoslať kód za {countdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium mt-2"
                  >
                    Znovu odoslať kód
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
```

## TESTING
1. Visit `/auth/login` → should show login page with Google/Apple/Email options
2. Click Google → should redirect to Google OAuth (placeholder)
3. Enter email → should check if exists
4. If exists → show password input
5. If not exists → show registration form
6. After login/registration → redirect to SMS verification
7. Enter phone → receive SMS code
8. Enter code → complete registration

## COMPLETION CRITERIA
- [ ] Customer role added to UserRole enum
- [ ] Email field added to User model
- [ ] Customer auth service created
- [ ] Google OAuth integrated (placeholder OK)
- [ ] Apple OAuth integrated (placeholder OK)
- [ ] Customer login/registration page created
- [ ] SMS verification page created
- [ ] Customer auth context created
- [ ] API functions added
- [ ] Tested end-to-end
- [ ] Create `/backend/src/auth/AGENT-13-COMPLETE.md`

## ENVIRONMENT VARIABLES (Future)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/customer/google/callback

# Apple OAuth
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
APPLE_REDIRECT_URI=http://localhost:3001/api/auth/customer/apple/callback
```

## NOTES
- Customer authentication is separate from admin authentication
- Customers use email, not username
- OAuth can be placeholder until credentials available
- SMS verification is mandatory after first login/registration
- Use existing SMS service from Agent 12
- Design should match MAYDAY PIZZA style (yellow accents, clean layout)
- Phone verification page should match design (orange banner, phone icon)

## START IMPLEMENTATION NOW

Begin by:
1. Updating database schema (add CUSTOMER role, email field)
2. Creating customer auth service
3. Creating customer auth controller
4. Creating frontend login page
5. Creating SMS verification page
6. Integrating OAuth (placeholder first)
7. Testing end-to-end

Good luck! 🚀


# 🎯 AGENT 12: SMS VERIFICATION & AUTH ENHANCEMENT

You are Agent 12 implementing SMS verification for first-time login.

## PROJECT CONTEXT
Users must verify their phone number via SMS code on first login. This adds security layer to authentication.

## YOUR WORKSPACE
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/src/auth/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /frontend/app/login/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /frontend/lib/`
- `/Users/jaroslav/Documents/CODING/WEBY miro /backend/prisma/`

**CRITICAL:** Only create/modify files in these folders.

## YOUR MISSION
1. Backend: SMS service for sending verification codes
2. Backend: API endpoints for SMS verification
3. Backend: Update User model to track phone verification
4. Frontend: SMS verification page UI
5. Frontend: Integrate SMS verification into login flow
6. Frontend: API functions for SMS verification

## DEPENDENCIES
- ✅ Agent 1 (Shared Types) - User type exists
- ✅ Agent 2 (Database/Auth) - Auth service exists
- ✅ Agent 6 (Frontend) - Login page exists

## FILES TO CREATE/MODIFY

### BACKEND FILES

#### 1. `/backend/src/auth/sms.service.ts` (NEW)
Create SMS service with:
- `sendVerificationCode(phoneNumber, userId)` - Generate and send 6-digit code
- `verifyCode(phoneNumber, code, userId)` - Verify code and mark phone as verified
- `resendCode(phoneNumber, userId)` - Resend code after 60 seconds
- In dev mode: log code to console
- In production: integrate with SMS provider (Twilio, MessageBird, etc.)

#### 2. `/backend/src/auth/auth.service.ts` (MODIFY)
Update `login()` method to:
- Check if user has `phoneNumber` and `phoneVerified`
- If not verified, return `{ needsSmsVerification: true, userId, phoneNumber }`
- If verified, continue normal login flow

#### 3. `/backend/src/auth/auth.controller.ts` (MODIFY)
Add endpoints:
- `POST /api/auth/send-sms-code` - Send SMS code
- `POST /api/auth/verify-sms` - Verify SMS code and complete login

#### 4. `/backend/src/auth/auth.module.ts` (MODIFY)
Add `SmsService` to providers

#### 5. `/backend/prisma/schema.prisma` (MODIFY)
Add to User model:
```prisma
phoneNumber    String?
phoneVerified  Boolean @default(false)
smsVerificationCodes SmsVerificationCode[]
```

Add new model:
```prisma
model SmsVerificationCode {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  phoneNumber String
  code        String
  expiresAt   DateTime
  isUsed      Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId, phoneNumber])
  @@index([code])
  @@map("sms_verification_codes")
}
```

#### 6. Create migration: `npx prisma migrate dev --name add_sms_verification`

### FRONTEND FILES

#### 7. `/frontend/app/login/verify-sms/page.tsx` (NEW)
Create SMS verification page with:
- Phone number input (if not provided)
- 6-digit code input
- Send code button
- Verify code button
- Resend code timer (60 seconds)
- Error handling
- Loading states

#### 8. `/frontend/app/login/page.tsx` (MODIFY)
Update login to:
- Check if response has `needsSmsVerification: true`
- If yes, redirect to `/login/verify-sms?userId=...&phoneNumber=...`
- If no, continue normal login

#### 9. `/frontend/lib/api.ts` (MODIFY)
Add functions:
- `sendSmsCode(phoneNumber: string, userId: string)`
- `verifySmsCode(phoneNumber: string, code: string, userId: string)`

#### 10. `/frontend/contexts/AuthContext.tsx` (MODIFY)
Update `login()` to handle SMS verification response

## IMPLEMENTATION DETAILS

### Backend SMS Service Structure
```typescript
@Injectable()
export class SmsService {
  async sendVerificationCode(phoneNumber: string, userId: string): Promise<string> {
    // Generate 6-digit code
    // Store in database with 10-minute expiry
    // In dev: log to console
    // In production: send via SMS provider
  }

  async verifyCode(phoneNumber: string, code: string, userId: string): Promise<boolean> {
    // Find code in database
    // Check expiry and usage
    // Mark as used
    // Update user phoneVerified = true
  }

  async resendCode(phoneNumber: string, userId: string): Promise<string> {
    // Invalidate old codes
    // Send new code
  }
}
```

### Frontend SMS Verification Page Structure
```typescript
export default function VerifySmsPage() {
  // State: phoneNumber, code, loading, error, countdown, codeSent
  // Functions: handleSendCode, handleVerify, handleResend
  // UI: Phone input (if needed), Code input, Send/Verify buttons, Timer
}
```

### Login Flow Update
```typescript
// In login page:
const result = await login(username, password);
if (result.needsSmsVerification) {
  router.push(`/login/verify-sms?userId=${result.userId}&phoneNumber=${result.phoneNumber || ''}`);
} else {
  router.push('/admin');
}
```

## TESTING
1. Login with user that has no phone number → should redirect to SMS verification
2. Enter phone number → should receive code (check console in dev mode)
3. Enter code → should complete login
4. Login again → should skip SMS verification (phone already verified)
5. Test resend code → should work after 60 seconds
6. Test expired code → should fail after 10 minutes

## COMPLETION CRITERIA
- [ ] SMS service created (`sms.service.ts`)
- [ ] Database schema updated with migration
- [ ] API endpoints working (`/api/auth/send-sms-code`, `/api/auth/verify-sms`)
- [ ] Frontend SMS verification page created (`/app/login/verify-sms/page.tsx`)
- [ ] Login flow integrated
- [ ] API functions added to `lib/api.ts`
- [ ] AuthContext updated
- [ ] Tested end-to-end
- [ ] Create `/backend/src/auth/AGENT-12-COMPLETE.md`

## ENVIRONMENT VARIABLES (Future - for production)
```env
# SMS Provider (for production)
SMS_PROVIDER=twilio  # or messagebird, etc.
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## NOTES
- In development, SMS codes are logged to console
- In production, integrate with SMS provider (Twilio, MessageBird, etc.)
- Codes expire after 10 minutes
- Codes can be resent after 60 seconds
- Phone verification is one-time (after first verification, skip on future logins)
- Use Slovak phone number format: +421 900 123 456
- Validate phone number format before sending code

## CODE EXAMPLES

### SMS Service Implementation
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private prisma: PrismaService) {}

  async sendVerificationCode(phoneNumber: string, userId: string): Promise<string> {
    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store code in database
    await this.prisma.smsVerificationCode.create({
      data: {
        userId,
        phoneNumber,
        code,
        expiresAt,
      },
    });

    // In dev mode: log to console
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`📱 SMS Code for ${phoneNumber}: ${code}`);
      this.logger.warn('⚠️  SMS service in DEV mode - code logged, not sent');
    } else {
      // Production: Send via SMS provider
      // await this.sendViaProvider(phoneNumber, code);
    }

    return code;
  }

  async verifyCode(phoneNumber: string, code: string, userId: string): Promise<boolean> {
    const verification = await this.prisma.smsVerificationCode.findFirst({
      where: {
        userId,
        phoneNumber,
        code,
        expiresAt: { gt: new Date() },
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return false;
    }

    // Mark as used
    await this.prisma.smsVerificationCode.update({
      where: { id: verification.id },
      data: { isUsed: true },
    });

    // Update user phone verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneNumber,
        phoneVerified: true,
      },
    });

    return true;
  }

  async resendCode(phoneNumber: string, userId: string): Promise<string> {
    // Invalidate old codes
    await this.prisma.smsVerificationCode.updateMany({
      where: {
        userId,
        phoneNumber,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    return this.sendVerificationCode(phoneNumber, userId);
  }
}
```

### Frontend SMS Verification Page
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendSmsCode, verifySmsCode } from '@/lib/api';

export default function VerifySmsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const phoneNumberParam = searchParams.get('phoneNumber');

  const [phone, setPhone] = useState(phoneNumberParam || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push('/login');
    }
  }, [userId, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid SMS code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SMS Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please verify your phone number to complete login
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {!codeSent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+421 900 123 456"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send SMS Code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="000000"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Code sent to {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              {countdown > 0 ? (
                <p className="text-sm text-center text-gray-500">
                  Resend code in {countdown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend Code
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
```

## START IMPLEMENTATION NOW

Begin by:
1. Creating the SMS service
2. Updating the database schema
3. Creating the migration
4. Adding API endpoints
5. Creating the frontend page
6. Integrating into login flow

Good luck! 🚀







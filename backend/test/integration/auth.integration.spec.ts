import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../../src/auth/sms.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Integration tests for AuthService
 * These tests use a REAL database (configured via TEST_DATABASE_URL or DATABASE_URL)
 * 
 * To run these tests:
 * 1. Set up a test database (e.g., postgresql://user:password@localhost:5432/pizza_test)
 * 2. Set TEST_DATABASE_URL environment variable
 * 3. Run: npm run test:e2e
 * 
 * WARNING: These tests will modify the database. Use a dedicated test database!
 */
describe('AuthService Integration Tests', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let authService: AuthService;
  let testUserId: string;
  let testTenantId: string;

  const testUser = {
    username: `test_user_${Date.now()}`,
    password: 'TestPassword123!',
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
  };

  beforeAll(async () => {
    // Check if test database is configured
    const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!testDbUrl) {
      throw new Error(
        'TEST_DATABASE_URL or DATABASE_URL must be set for integration tests. ' +
        'Use a dedicated test database to avoid data loss!'
      );
    }

    module = await Test.createTestingModule({
      providers: [
        PrismaService,
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mock-jwt-token'),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendVerificationCode: jest.fn(),
            verifyCode: jest.fn(),
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);

    // Create a test tenant for testing
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'pornopizza' },
    });
    if (tenant) {
      testTenantId = tenant.id;
    } else {
      const newTenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          slug: `test_tenant_${Date.now()}`,
          subdomain: `test_tenant_${Date.now()}`,
          domain: 'test.localhost',
          theme: {},
          paymentConfig: {},
          deliveryConfig: {},
        },
      });
      testTenantId = newTenant.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { username: testUser.username },
            { email: testUser.email },
          ],
        },
      });
    }
    await prisma.refreshToken.deleteMany({
      where: { userId: testUserId },
    });
    await module.close();
  });

  describe('User Registration and Login', () => {
    it('should create a user with unique username and email', async () => {
      // Create user directly via Prisma (simulating registration)
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const user = await prisma.user.create({
        data: {
          username: testUser.username,
          password: hashedPassword,
          name: testUser.name,
          email: testUser.email,
          role: 'CUSTOMER',
          isActive: true,
        },
      });

      expect(user).toBeDefined();
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      testUserId = user.id;
    });

    it('should enforce unique username constraint', async () => {
      // Try to create another user with the same username
      const hashedPassword = await bcrypt.hash('AnotherPassword123!', 10);
      
      await expect(
        prisma.user.create({
          data: {
            username: testUser.username, // Duplicate username
            password: hashedPassword,
            name: 'Another User',
            email: `another_${Date.now()}@example.com`,
            role: 'CUSTOMER',
            isActive: true,
          },
        })
      ).rejects.toThrow(); // Should throw Prisma unique constraint error
    });

    it('should enforce unique email constraint', async () => {
      // Try to create another user with the same email
      const hashedPassword = await bcrypt.hash('AnotherPassword123!', 10);
      
      await expect(
        prisma.user.create({
          data: {
            username: `another_${Date.now()}`,
            password: hashedPassword,
            name: 'Another User',
            email: testUser.email, // Duplicate email
            role: 'CUSTOMER',
            isActive: true,
          },
        })
      ).rejects.toThrow(); // Should throw Prisma unique constraint error
    });

    it('should validate user credentials correctly', async () => {
      const result = await authService.validateUser(
        testUser.username,
        testUser.password
      );

      expect(result).toBeDefined();
      expect(result.username).toBe(testUser.username);
      expect(result.name).toBe(testUser.name);
      expect(result.role).toBe('CUSTOMER');
      // Password should not be returned (it's in UserWithoutPassword type)
      expect('password' in result).toBe(false);
    });

    it('should reject invalid password', async () => {
      await expect(
        authService.validateUser(testUser.username, 'WrongPassword123!')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject non-existent username', async () => {
      await expect(
        authService.validateUser('nonexistent_user', 'SomePassword123!')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh Token Management', () => {
    it('should create and store refresh token', async () => {
      const refreshToken = 'test_refresh_token_' + Date.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const tokenRecord = await prisma.refreshToken.create({
        data: {
          userId: testUserId,
          token: refreshToken,
          expiresAt,
        },
      });

      expect(tokenRecord).toBeDefined();
      expect(tokenRecord.userId).toBe(testUserId);
      expect(tokenRecord.token).toBe(refreshToken);
      expect(tokenRecord.isRevoked).toBe(false);
    });

    it('should find refresh token by token value', async () => {
      const refreshToken = 'test_find_token_' + Date.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          userId: testUserId,
          token: refreshToken,
          expiresAt,
        },
      });

      const found = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      expect(found).toBeDefined();
      expect(found?.token).toBe(refreshToken);
      expect(found?.user.id).toBe(testUserId);
    });

    it('should revoke refresh token', async () => {
      const refreshToken = 'test_revoke_token_' + Date.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          userId: testUserId,
          token: refreshToken,
          expiresAt,
        },
      });

      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });

      const revoked = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      expect(revoked?.isRevoked).toBe(true);
    });
  });

  describe('Database Constraints', () => {
    it('should enforce required fields', async () => {
      // Try to create user without required fields
      await expect(
        prisma.user.create({
          data: {
            // Missing username, password, name
            email: `missing_fields_${Date.now()}@example.com`,
            role: 'CUSTOMER',
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should handle foreign key constraints', async () => {
      // Try to create refresh token with non-existent user ID
      await expect(
        prisma.refreshToken.create({
          data: {
            userId: 'non-existent-user-id',
            token: 'test_token',
            expiresAt: new Date(),
          },
        })
      ).rejects.toThrow();
    });
  });
});


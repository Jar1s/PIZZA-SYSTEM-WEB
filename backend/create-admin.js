const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const weakPasswords = new Set([
  'admin',
  'operator',
  'password',
  '123456',
  '12345678',
  `${'admin'}123`,
  `${'operator'}123`,
  `${'password'}123`,
]);

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function validatePassword(password) {
  if (password.length < 14) {
    throw new Error('ADMIN_PASSWORD must be at least 14 characters long');
  }

  if (weakPasswords.has(password.toLowerCase())) {
    throw new Error('ADMIN_PASSWORD is too weak');
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('ADMIN_PASSWORD must include lowercase, uppercase, and a number');
  }
}

function resolveRole(rawRole) {
  const role = (rawRole || 'ADMIN').trim().toUpperCase();
  if (!['ADMIN', 'OPERATOR'].includes(role)) {
    throw new Error('ADMIN_ROLE must be ADMIN or OPERATOR');
  }
  return role;
}

async function main() {
  const username = requiredEnv('ADMIN_USERNAME');
  const password = requiredEnv('ADMIN_PASSWORD');
  const tenantSlug = requiredEnv('ADMIN_TENANT_SLUG');
  const role = resolveRole(process.env.ADMIN_ROLE);
  const name = process.env.ADMIN_NAME?.trim() || username;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || null;

  validatePassword(password);

  const prisma = new PrismaClient();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantSlug}`);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        tenantId: tenant.id,
        password: passwordHash,
        name,
        email,
        role: UserRole[role],
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        username,
        password: passwordHash,
        name,
        email,
        role: UserRole[role],
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    console.log('Admin user upserted:', {
      id: user.id,
      username: user.username,
      role: user.role,
      tenantSlug: tenant.slug,
      isActive: user.isActive,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Failed to create admin:', error.message || error);
    process.exitCode = 1;
  });

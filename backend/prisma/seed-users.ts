import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const blockedSeedPasswords = [
  `${'admin'}123`,
  `${'operator'}123`,
  `${'password'}123`,
  'password',
];

async function seedUsers() {
  console.log('👤 Seeding users...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed-users.ts is disabled in production. Use npm run create-admin with strong env credentials.');
  }

  const adminPlainPassword = process.env.SEED_ADMIN_PASSWORD;
  const operatorPlainPassword = process.env.SEED_OPERATOR_PASSWORD;

  if (!adminPlainPassword || !operatorPlainPassword) {
    throw new Error('Set SEED_ADMIN_PASSWORD and SEED_OPERATOR_PASSWORD before running seed-users.ts');
  }

  if (
    blockedSeedPasswords.includes(adminPlainPassword) ||
    blockedSeedPasswords.includes(operatorPlainPassword)
  ) {
    throw new Error('Refusing to seed users with default or weak passwords');
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash(adminPlainPassword, 10);
  const operatorPassword = await bcrypt.hash(operatorPlainPassword, 10);

  const defaultTenant = await prisma.tenant.findFirst({ where: { slug: 'pornopizza' } })
    || await prisma.tenant.findFirst();

  if (!defaultTenant) {
    throw new Error('No tenant found to assign admin users');
  }

  const tenantId = defaultTenant.id;

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { tenantId },
    create: {
      tenantId,
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Created admin: ${admin.username}`);

  // Create operator user
  const operator = await prisma.user.upsert({
    where: { username: 'operator' },
    update: { tenantId },
    create: {
      tenantId,
      username: 'operator',
      password: operatorPassword,
      name: 'Operator User',
      role: UserRole.OPERATOR,
      isActive: true,
    },
  });

  console.log(`✅ Created operator: ${operator.username}`);

  console.log('\n📋 Login Credentials:');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: from SEED_ADMIN_PASSWORD');
  console.log('\nOperator:');
  console.log('  Username: operator');
  console.log('  Password: from SEED_OPERATOR_PASSWORD');
}

seedUsers()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

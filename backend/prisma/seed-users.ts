import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('👤 Seeding users...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operator123', 10);

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
  console.log('  Password: admin123');
  console.log('\nOperator:');
  console.log('  Username: operator');
  console.log('  Password: operator123');
}

seedUsers()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


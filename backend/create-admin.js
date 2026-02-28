#!/usr/bin/env node

/**
 * Script to create admin user in database
 * Usage:
 *   node create-admin.js
 *   Or with custom DATABASE_URL:
 *   DATABASE_URL="postgresql://..." node create-admin.js
 */

const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('👤 Creating admin user...');

  try {
    // Hash password
    const adminPassword = await bcrypt.hash('admin123', 10);

    const defaultTenant = await prisma.tenant.findFirst({ where: { slug: 'pornopizza' } })
      || await prisma.tenant.findFirst();

    if (!defaultTenant) {
      throw new Error('No tenant found to assign admin users');
    }

    const tenantId = defaultTenant.id;

    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: adminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
        tenantId,
      },
      create: {
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        role: UserRole.ADMIN,
        isActive: true,
        tenantId,
      },
    });

    console.log(`✅ Admin user created/updated: ${admin.username}`);
    console.log('\n📋 Login Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\n🎉 You can now login at: https://pizza-system-web.vercel.app/login');

    // Also create operator user
    const operatorPassword = await bcrypt.hash('operator123', 10);
    const operator = await prisma.user.upsert({
      where: { username: 'operator' },
      update: {
        password: operatorPassword,
        name: 'Operator User',
        role: UserRole.OPERATOR,
        isActive: true,
        tenantId,
      },
      create: {
        username: 'operator',
        password: operatorPassword,
        name: 'Operator User',
        role: UserRole.OPERATOR,
        isActive: true,
        tenantId,
      },
    });

    console.log(`✅ Operator user created/updated: ${operator.username}`);
    console.log('  Username: operator');
    console.log('  Password: operator123');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    if (error.code === 'P2002') {
      console.error('   User already exists, updating...');
    } else {
      console.error('   Full error:', error);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


#!/usr/bin/env node

/**
 * Script to create a test order with PAID status directly in database
 * Usage:
 *   node create-test-order-db.js
 *   Or with custom email:
 *   CUSTOMER_EMAIL="jardo.bir@gmail.com" node create-test-order-db.js
 */

const { PrismaClient, OrderStatus, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_SLUG = process.env.TENANT_SLUG || 'pornopizza';
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL || 'jardo.bir@gmail.com';

async function createTestOrder() {
  console.log('📦 Creating test order in database...');
  console.log(`   Tenant: ${TENANT_SLUG}`);
  console.log(`   Customer: ${CUSTOMER_EMAIL}`);

  try {
    // Step 1: Get tenant
    console.log('\n1️⃣ Fetching tenant...');
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${TENANT_SLUG}`);
    }
    console.log(`   ✅ Found tenant: ${tenant.name} (ID: ${tenant.id})`);

    // Step 2: Get or create customer user
    console.log('\n2️⃣ Getting or creating customer...');
    const normalizedEmail = CUSTOMER_EMAIL.toLowerCase().trim();
    let user = await prisma.user.findFirst({
      where: { email: normalizedEmail, tenantId: tenant.id, role: UserRole.CUSTOMER },
    });

    if (!user) {
      console.log('   Creating new user...');
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: 'Jaroslav Bir',
          email: normalizedEmail,
          phone: '+421900123456',
          phoneVerified: false,
          role: UserRole.CUSTOMER,
          isActive: true,
        },
      });
      console.log(`   ✅ Created user: ${user.id}`);
    } else {
      console.log(`   ✅ Found existing user: ${user.id}`);
    }

    // Step 3: Get a product (using raw query to avoid schema mismatch)
    console.log('\n3️⃣ Fetching products...');
    const products = await prisma.$queryRaw`
      SELECT id, name, "priceCents", category
      FROM products
      WHERE "tenantId" = ${tenant.id} AND "isActive" = true
      LIMIT 1
    `;
    const product = products[0];

    if (!product) {
      throw new Error('No active products found. Please seed products first.');
    }
    console.log(`   ✅ Found product: ${product.name} (ID: ${product.id})`);

    // Step 4: Create order with PAID status using raw SQL (to avoid schema mismatch)
    console.log('\n4️⃣ Creating order with PAID status...');
    const customerJson = JSON.stringify({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    const addressJson = JSON.stringify({
      street: 'Test Street 123',
      city: 'Bratislava',
      postalCode: '81101',
      country: 'Slovakia',
      instructions: 'Test order for email testing',
    });
    const subtotalCents = product.priceCents;
    const deliveryFeeCents = 200;
    const totalCents = subtotalCents + deliveryFeeCents;

    // Generate IDs using cuid format (similar to Prisma)
    const { randomBytes } = require('crypto');
    const orderId = 'c' + randomBytes(12).toString('hex');
    const orderItemId = 'c' + randomBytes(12).toString('hex');

    // Create order using raw SQL
    const orderResult = await prisma.$queryRaw`
      INSERT INTO orders (
        id, "tenantId", "userId", status, customer, address,
        "subtotalCents", "taxCents", "deliveryFeeCents", "totalCents",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${orderId}::text,
        ${tenant.id}::text,
        ${user.id}::text,
        ${OrderStatus.PAID}::"OrderStatus",
        ${customerJson}::jsonb,
        ${addressJson}::jsonb,
        ${subtotalCents},
        0,
        ${deliveryFeeCents},
        ${totalCents},
        NOW(),
        NOW()
      )
      RETURNING id, status, "totalCents", customer
    `;
    const order = orderResult[0];

    // Create order item
    await prisma.$executeRaw`
      INSERT INTO order_items (
        id, "orderId", "productId", "productName", quantity, "priceCents", modifiers
      )
      VALUES (
        ${orderItemId}::text,
        ${order.id}::text,
        ${product.id}::text,
        ${product.name}::text,
        1,
        ${product.priceCents},
        NULL::jsonb
      )
    `;

    console.log(`   ✅ Order created:`);
    console.log(`      ID: ${order.id}`);
    console.log(`      Order Number: ${order.orderNumber ? `#${order.orderNumber.toString().padStart(4, '0')}` : 'N/A'}`);
    console.log(`      Status: ${order.status}`);
    console.log(`      Total: €${(order.totalCents / 100).toFixed(2)}`);
    const customerData = typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer;
    console.log(`      Customer: ${customerData.email}`);

    console.log('\n🎉 Test order created successfully!');
    console.log(`\n📧 Emails should be sent to: ${CUSTOMER_EMAIL}`);
    console.log(`\n⚠️  Note: This script creates the order directly in the database.`);
    console.log(`   To trigger email sending, you may need to manually trigger the email service`);
    console.log(`   or use the API endpoint to update the order status.`);

  } catch (error) {
    console.error('\n❌ Failed to create test order:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();







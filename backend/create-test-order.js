#!/usr/bin/env node

/**
 * Script to create a test order with PAID status for testing emails
 * Usage:
 *   node create-test-order.js
 *   Or with custom API URL:
 *   API_URL="http://localhost:3000" node create-test-order.js
 */

// Try to get API URL from environment or use production URL
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://pizza-system-backend.onrender.com';
const TENANT_SLUG = process.env.TENANT_SLUG || 'pornopizza';
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL || 'jardo.bir@gmail.com';

async function createTestOrder() {
  console.log('📦 Creating test order...');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Tenant: ${TENANT_SLUG}`);
  console.log(`   Customer: ${CUSTOMER_EMAIL}`);

  try {
    // Step 1: Get a product to use in the order
    console.log('\n1️⃣ Fetching products...');
    const productsResponse = await fetch(`${API_URL}/api/${TENANT_SLUG}/products?isActive=all`);
    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`);
    }
    const products = await productsResponse.json();
    
    if (products.length === 0) {
      throw new Error('No products found. Please seed products first.');
    }
    
    // Use first active product, or first product if none are active
    const product = products.find(p => p.isActive) || products[0];
    console.log(`   ✅ Found product: ${product.name} (ID: ${product.id})`);

    // Step 2: Create order
    console.log('\n2️⃣ Creating order...');
    const orderData = {
      customer: {
        name: 'Jaroslav Bir',
        email: CUSTOMER_EMAIL,
        phone: '+421900123456',
      },
      address: {
        street: 'Test Street 123',
        city: 'Bratislava',
        postalCode: '81101',
        country: 'Slovakia',
        instructions: 'Test order for email testing',
      },
      items: [
        {
          productId: product.id,
          quantity: 1,
          modifiers: product.modifiers && Array.isArray(product.modifiers) && product.modifiers.length > 0
            ? {} // Empty modifiers if product has optional modifiers
            : undefined,
        },
      ],
      deliveryFeeCents: 200, // €2.00
      paymentMethod: 'card', // This will create the order with PENDING status
    };

    const createOrderResponse = await fetch(`${API_URL}/api/${TENANT_SLUG}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!createOrderResponse.ok) {
      const errorText = await createOrderResponse.text();
      throw new Error(`Failed to create order: ${createOrderResponse.status} ${createOrderResponse.statusText}\n${errorText}`);
    }

    const orderResult = await createOrderResponse.json();
    const order = orderResult.order || orderResult;
    console.log(`   ✅ Order created: ${order.id}`);
    console.log(`   Order Number: ${order.orderNumber ? `#${order.orderNumber.toString().padStart(4, '0')}` : 'N/A'}`);
    console.log(`   Status: ${order.status}`);

    // Step 3: Update order status to PAID
    console.log('\n3️⃣ Updating order status to PAID...');
    const updateStatusResponse = await fetch(`${API_URL}/api/${TENANT_SLUG}/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'PAID' }),
    });

    if (!updateStatusResponse.ok) {
      const errorText = await updateStatusResponse.text();
      throw new Error(`Failed to update order status: ${updateStatusResponse.status} ${updateStatusResponse.statusText}\n${errorText}`);
    }

    const statusResult = await updateStatusResponse.json();
    console.log(`   ✅ Order status updated to PAID`);
    console.log(`   ${statusResult.message || 'Status updated successfully'}`);

    // Step 4: Fetch updated order to verify
    console.log('\n4️⃣ Verifying order...');
    const getOrderResponse = await fetch(`${API_URL}/api/${TENANT_SLUG}/orders/${order.id}`);
    if (getOrderResponse.ok) {
      const updatedOrder = await getOrderResponse.json();
      console.log(`   ✅ Order verified:`);
      console.log(`      ID: ${updatedOrder.id}`);
      console.log(`      Order Number: ${updatedOrder.orderNumber ? `#${updatedOrder.orderNumber.toString().padStart(4, '0')}` : 'N/A'}`);
      console.log(`      Status: ${updatedOrder.status}`);
      console.log(`      Total: €${(updatedOrder.totalCents / 100).toFixed(2)}`);
      console.log(`      Customer: ${updatedOrder.customer.email}`);
    }

    console.log('\n🎉 Test order created successfully!');
    console.log(`\n📧 Emails should be sent to: ${CUSTOMER_EMAIL}`);
    console.log(`\n🔗 Order tracking: ${API_URL}/order/${order.id}`);

  } catch (error) {
    console.error('\n❌ Failed to create test order:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

createTestOrder();







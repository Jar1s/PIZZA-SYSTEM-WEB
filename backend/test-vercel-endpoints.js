#!/usr/bin/env node

/**
 * Test script to verify Vercel backend endpoints after deployment
 * Usage: node test-vercel-endpoints.js [baseUrl]
 * Example: node test-vercel-endpoints.js https://your-backend.vercel.app
 */

const baseUrl = process.argv[2] || process.env.VERCEL_URL || 'http://localhost:4000';

const endpoints = [
  { path: '/api/health', method: 'GET', description: 'Health check' },
  { path: '/api/tenants/pornopizza', method: 'GET', description: 'Get pornopizza tenant' },
  { path: '/api/tenants/pizzavnudzi', method: 'GET', description: 'Get pizzavnudzi tenant' },
];

async function testEndpoint(path, method, description) {
  const url = `${baseUrl}${path}`;
  try {
    const startTime = Date.now();
    const response = await fetch(url, { method });
    const duration = Date.now() - startTime;
    
    let body = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }
    
    const status = response.status;
    const statusEmoji = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
    
    console.log(`${statusEmoji} ${description}`);
    console.log(`   ${method} ${path}`);
    console.log(`   Status: ${status}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (status >= 400) {
      console.log(`   Error: ${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`);
    } else if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      // Show first few keys of response
      const keys = Object.keys(body).slice(0, 3);
      console.log(`   Response keys: ${keys.join(', ')}${Object.keys(body).length > 3 ? '...' : ''}`);
    }
    
    console.log('');
    
    return { success: status >= 200 && status < 300, status, duration };
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   ${method} ${path}`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`🧪 Testing Vercel Backend Endpoints`);
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log('');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.path, endpoint.method, endpoint.description);
    results.push({ ...endpoint, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  console.log(`   ✅ Successful: ${successful}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}/${results.length}`);
  if (avgDuration) {
    console.log(`   ⏱️  Average duration: ${Math.round(avgDuration)}ms`);
  }
  
  if (failed > 0) {
    console.log('');
    console.log('Failed endpoints:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   ❌ ${r.description} (${r.path})`);
      });
    process.exit(1);
  } else {
    console.log('');
    console.log('🎉 All endpoints are working!');
    process.exit(0);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (for native fetch support)');
  console.error('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});


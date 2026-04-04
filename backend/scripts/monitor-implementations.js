#!/usr/bin/env node

/**
 * Monitoring Dashboard for All Implementations
 * 
 * Checks and reports status of:
 * - Rate Limiting
 * - Retry Logic
 * - Structured Logging
 * - Zod Validation
 * - CSP Headers
 * - Sentry Integration
 * - E2E Tests
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);
  return { exists, path: fullPath, description };
}

function countMatches(filePath, pattern, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    return { count: 0, description, found: false };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(new RegExp(pattern, 'g')) || [];
  return { count: matches.length, description, found: true };
}

function checkDirectory(dirPath, pattern, description) {
  const fullDir = path.join(__dirname, '..', dirPath);
  if (!fs.existsSync(fullDir)) {
    return { count: 0, description, found: false };
  }
  
  let count = 0;
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        // If pattern looks like a filename pattern (contains .spec. or similar), check filename
        if (pattern.includes('\\.spec\\.') || pattern.includes('.spec.')) {
          if (file.match(new RegExp(pattern.replace(/\\/g, ''), 'i'))) {
            count++;
          }
        } else {
          // Otherwise, search in file content
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.match(new RegExp(pattern, 'g')) || [];
          count += matches.length;
        }
      }
    }
  }
  walkDir(fullDir);
  return { count, description, found: count > 0 };
}

// Main monitoring function
function monitorImplementations() {
  log('\n' + '='.repeat(80), 'cyan');
  log('🔍 MONITORING DASHBOARD - Implementation Status', 'bold');
  log('='.repeat(80) + '\n', 'cyan');

  const results = {
    rateLimiting: [],
    retryLogic: [],
    structuredLogging: [],
    zodValidation: [],
    cspHeaders: [],
    sentry: [],
    e2eTests: [],
  };

  // 1. Rate Limiting
  log('📊 1. RATE LIMITING', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const throttleChecks = [
    checkDirectory('src/orders', '@Throttle', 'Orders Controller'),
    checkDirectory('src/delivery', '@Throttle', 'Delivery Controller'),
    checkDirectory('src/auth', '@Throttle', 'Auth Controllers'),
  ];
  
  throttleChecks.forEach(check => {
    if (check.found && check.count > 0) {
      log(`   ✅ ${check.description}: ${check.count} @Throttle decorators`, 'green');
      results.rateLimiting.push({ status: 'ok', count: check.count, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.rateLimiting.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  
  const totalThrottles = throttleChecks.reduce((sum, c) => sum + c.count, 0);
  log(`   📈 Total: ${totalThrottles} rate-limited endpoints\n`, totalThrottles > 0 ? 'green' : 'red');

  // 2. Retry Logic
  log('🔄 2. RETRY LOGIC', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const retryChecks = [
    countMatches('src/delivery/wolt-drive.service.ts', 'maxRetries', 'WoltDriveService'),
    countMatches('src/delivery/wolt-drive.service.ts', 'exponential|backoff', 'Exponential Backoff'),
    countMatches('src/orders/orders.service.ts', 'syncOrderToStoryousWithRetry', 'Storyous Retry'),
  ];
  
  retryChecks.forEach(check => {
    if (check.found && check.count > 0) {
      log(`   ✅ ${check.description}: ${check.count} implementations`, 'green');
      results.retryLogic.push({ status: 'ok', count: check.count, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.retryLogic.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  log('');

  // 3. Structured Logging
  log('📝 3. STRUCTURED LOGGING', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const loggingChecks = [
    countMatches('src/orders/orders.service.ts', 'this\\.logger\\.(log|error|warn).*\\{', 'Orders Service (with context)'),
    checkDirectory('src/delivery', 'this\\.logger\\.(log|error|warn)', 'Delivery Services'),
    countMatches('src/orders/orders.service.ts', 'console\\.(log|error|warn)', 'Console.log (should be 0)'),
  ];
  
  loggingChecks.forEach(check => {
    if (check.description.includes('Console.log')) {
      if (check.count === 0) {
        log(`   ✅ ${check.description}: No console.log found (good!)`, 'green');
        results.structuredLogging.push({ status: 'ok', count: 0, name: check.description });
      } else {
        log(`   ⚠️  ${check.description}: ${check.count} console.log found (should use Logger)`, 'yellow');
        results.structuredLogging.push({ status: 'warning', count: check.count, name: check.description });
      }
    } else if (check.found && check.count > 0) {
      log(`   ✅ ${check.description}: ${check.count} logger calls with context`, 'green');
      results.structuredLogging.push({ status: 'ok', count: check.count, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.structuredLogging.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  log('');

  // 4. Zod Validation
  log('✅ 4. ZOD VALIDATION', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const zodChecks = [
    checkFile('src/common/schemas/tenant.schema.ts', 'Tenant Schema'),
    checkFile('src/common/schemas/order.schema.ts', 'Order Schema'),
    checkFile('src/common/schemas/delivery.schema.ts', 'Delivery Schema'),
    countMatches('src/tenants/tenants.service.ts', 'TenantResponseSchema\\.parse', 'Tenant Validation'),
    countMatches('src/orders/orders.service.ts', 'OrderResponseSchema\\.parse', 'Order Validation'),
    countMatches('src/delivery/delivery-zone.service.ts', 'DeliveryFeeResponseSchema\\.parse', 'Delivery Validation'),
    checkFile('../frontend/lib/schemas/api.schema.ts', 'Frontend Schemas'),
    countMatches('../frontend/lib/api.ts', 'safeParse', 'Frontend Validation'),
  ];
  
  zodChecks.forEach(check => {
    if (check.exists || (check.count && check.count > 0)) {
      const status = check.exists ? 'File exists' : `${check.count} validations`;
      log(`   ✅ ${check.description}: ${status}`, 'green');
      results.zodValidation.push({ status: 'ok', count: check.count || 1, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.zodValidation.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  log('');

  // 5. CSP Headers
  log('🔒 5. CSP HEADERS', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const cspChecks = [
    countMatches('src/main.ts', 'connectSrc', 'connectSrc directive'),
    countMatches('src/main.ts', 'fontSrc', 'fontSrc directive'),
    countMatches('src/main.ts', 'frameSrc', 'frameSrc directive'),
    countMatches('src/main.ts', 'upgradeInsecureRequests', 'upgradeInsecureRequests'),
  ];
  
  cspChecks.forEach(check => {
    if (check.count > 0) {
      log(`   ✅ ${check.description}: Found`, 'green');
      results.cspHeaders.push({ status: 'ok', count: check.count, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.cspHeaders.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  log('');

  // 6. Sentry Integration
  log('📡 6. SENTRY INTEGRATION', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const sentryChecks = [
    checkFile('src/config/sentry.config.ts', 'Backend Sentry Config'),
    checkFile('../frontend/sentry.client.config.ts', 'Frontend Client Config'),
    checkFile('../frontend/sentry.server.config.ts', 'Frontend Server Config'),
    checkFile('../frontend/app/error.tsx', 'Error Boundary'),
    countMatches('src/main.ts', 'initSentry', 'Sentry Initialization'),
    countMatches('../frontend/next.config.js', 'withSentryConfig', 'Next.js Sentry Wrapper'),
  ];
  
  sentryChecks.forEach(check => {
    if (check.exists || check.count > 0) {
      const status = check.exists ? 'File exists' : 'Found';
      log(`   ✅ ${check.description}: ${status}`, 'green');
      results.sentry.push({ status: 'ok', count: 1, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.sentry.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  
  // Check .env files
  const envBackend = checkFile('.env', 'Backend .env (check SENTRY_DSN manually)');
  const envFrontend = checkFile('../frontend/.env.local', 'Frontend .env.local (check NEXT_PUBLIC_SENTRY_DSN manually)');
  
  if (envBackend.exists) {
    const envContent = fs.readFileSync(envBackend.path, 'utf8');
    if (envContent.includes('SENTRY_DSN')) {
      log(`   ✅ Backend .env: SENTRY_DSN configured`, 'green');
      results.sentry.push({ status: 'ok', count: 1, name: 'Backend DSN' });
    } else {
      log(`   ⚠️  Backend .env: SENTRY_DSN not found`, 'yellow');
      results.sentry.push({ status: 'warning', count: 0, name: 'Backend DSN' });
    }
  }
  
  if (envFrontend.exists) {
    const envContent = fs.readFileSync(envFrontend.path, 'utf8');
    if (envContent.includes('NEXT_PUBLIC_SENTRY_DSN')) {
      log(`   ✅ Frontend .env.local: NEXT_PUBLIC_SENTRY_DSN configured`, 'green');
      results.sentry.push({ status: 'ok', count: 1, name: 'Frontend DSN' });
    } else {
      log(`   ⚠️  Frontend .env.local: NEXT_PUBLIC_SENTRY_DSN not found`, 'yellow');
      results.sentry.push({ status: 'warning', count: 0, name: 'Frontend DSN' });
    }
  }
  log('');

  // 7. E2E Tests
  log('🧪 7. E2E TESTS', 'bold');
  log('─'.repeat(80), 'cyan');
  
  const e2eChecks = [
    checkFile('../.github/workflows/e2e-tests.yml', 'E2E Workflow'),
    checkDirectory('../frontend/e2e', '\\.spec\\.ts', 'E2E Test Files'),
    countMatches('../.github/workflows/e2e-tests.yml', 'playwright', 'Playwright Setup'),
    countMatches('../.github/workflows/e2e-tests.yml', 'test:e2e', 'E2E Test Command'),
  ];
  
  e2eChecks.forEach(check => {
    if (check.exists || (check.count && check.count > 0)) {
      const status = check.exists ? 'File exists' : `${check.count} found`;
      log(`   ✅ ${check.description}: ${status}`, 'green');
      results.e2eTests.push({ status: 'ok', count: check.count || 1, name: check.description });
    } else {
      log(`   ❌ ${check.description}: Not found`, 'red');
      results.e2eTests.push({ status: 'missing', count: 0, name: check.description });
    }
  });
  log('');

  // Summary
  log('='.repeat(80), 'cyan');
  log('📊 SUMMARY', 'bold');
  log('='.repeat(80) + '\n', 'cyan');

  const categories = [
    { name: 'Rate Limiting', results: results.rateLimiting },
    { name: 'Retry Logic', results: results.retryLogic },
    { name: 'Structured Logging', results: results.structuredLogging },
    { name: 'Zod Validation', results: results.zodValidation },
    { name: 'CSP Headers', results: results.cspHeaders },
    { name: 'Sentry Integration', results: results.sentry },
    { name: 'E2E Tests', results: results.e2eTests },
  ];

  let totalOk = 0;
  let totalWarning = 0;
  let totalMissing = 0;

  categories.forEach(category => {
    const ok = category.results.filter(r => r.status === 'ok').length;
    const warning = category.results.filter(r => r.status === 'warning').length;
    const missing = category.results.filter(r => r.status === 'missing').length;
    
    totalOk += ok;
    totalWarning += warning;
    totalMissing += missing;

    const total = category.results.length;
    const percentage = total > 0 ? Math.round((ok / total) * 100) : 0;
    
    let statusColor = 'green';
    if (missing > 0) statusColor = 'red';
    else if (warning > 0) statusColor = 'yellow';

    log(`   ${category.name}:`, 'bold');
    log(`      ✅ OK: ${ok}/${total} (${percentage}%)`, ok === total ? 'green' : 'yellow');
    if (warning > 0) log(`      ⚠️  Warnings: ${warning}`, 'yellow');
    if (missing > 0) log(`      ❌ Missing: ${missing}`, 'red');
    log('');
  });

  log('─'.repeat(80), 'cyan');
  log(`   Total: ✅ ${totalOk} OK | ⚠️  ${totalWarning} Warnings | ❌ ${totalMissing} Missing`, 'bold');
  log('─'.repeat(80) + '\n', 'cyan');

  // Generate JSON report
  const reportPath = path.join(__dirname, '..', 'monitoring-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`📄 Detailed report saved to: monitoring-report.json\n`, 'cyan');

  // Exit code
  process.exit(totalMissing > 0 ? 1 : 0);
}

// Run monitoring
monitorImplementations();


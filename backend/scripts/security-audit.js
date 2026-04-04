#!/usr/bin/env node

/**
 * Security Audit Script
 * Checks for common security issues in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const issues = {
  critical: [],
  serious: [],
  warnings: [],
};

function scanFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Check for hardcoded secrets
  const secretPatterns = [
    /password\s*[:=]\s*['"](?!null|undefined)[^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"](?!null|undefined)[^'"]+['"]/gi,
    /secret\s*[:=]\s*['"](?!null|undefined)[^'"]+['"]/gi,
    /token\s*[:=]\s*['"](?!null|undefined)[^'"]+['"]/gi,
  ];
  
  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.critical.push({
        file: relativePath,
        issue: 'Potential hardcoded secret',
        matches: matches.slice(0, 3), // Show first 3 matches
      });
    }
  });
  
  // Check for SQL injection risks
  if (content.includes('prisma.$queryRaw') || content.includes('prisma.$executeRaw')) {
    const rawQueryMatches = content.match(/\$\{.*\}/g);
    if (rawQueryMatches) {
      issues.serious.push({
        file: relativePath,
        issue: 'Raw SQL query with template literals - potential SQL injection',
      });
    }
  }
  
  // Check for disabled security features
  if (content.includes('SKIP_WEBHOOK_VERIFICATION') && !content.includes('appConfig.skipWebhookVerification')) {
    issues.serious.push({
      file: relativePath,
      issue: 'Webhook verification may be disabled - check environment variable usage',
    });
  }
  
  // Check for NODE_ENV === 'development' security bypasses
  if (content.match(/NODE_ENV\s*===\s*['"]development['"]/)) {
    issues.warnings.push({
      file: relativePath,
      issue: 'Using NODE_ENV for security checks - prefer explicit env variables',
    });
  }
  
  // Check for excessive 'as any' usage
  const asAnyMatches = content.match(/as\s+any/gi);
  if (asAnyMatches && asAnyMatches.length > 5) {
    issues.warnings.push({
      file: relativePath,
      issue: `Excessive use of 'as any' (${asAnyMatches.length} occurrences) - reduces type safety`,
    });
  }
  
  // Check for missing error handling
  if (content.includes('catch') && !content.includes('catch (error')) {
    // This is a weak check, but can catch some cases
  }
  
  // Check for console.log with sensitive data
  const consoleLogMatches = content.match(/console\.(log|warn|error)\([^)]*password[^)]*\)/gi);
  if (consoleLogMatches) {
    issues.serious.push({
      file: relativePath,
      issue: 'Console log may contain sensitive data (password)',
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, .git
      if (!['node_modules', 'dist', '.git', '.next'].includes(file)) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // Only scan TypeScript/JavaScript files
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          scanFile(filePath, content);
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  });
}

function main() {
  console.log('🔍 Running security audit...\n');
  
  const backendDir = path.join(__dirname, '..', 'src');
  if (fs.existsSync(backendDir)) {
    scanDirectory(backendDir);
  }
  
  // Print results
  console.log('\n📊 Security Audit Results:\n');
  
  if (issues.critical.length > 0) {
    console.log(`${RED}❌ CRITICAL ISSUES (${issues.critical.length}):${RESET}`);
    issues.critical.forEach(issue => {
      console.log(`  ${RED}•${RESET} ${issue.file}`);
      console.log(`    ${issue.issue}`);
      if (issue.matches) {
        console.log(`    Matches: ${issue.matches.join(', ')}`);
      }
    });
    console.log('');
  }
  
  if (issues.serious.length > 0) {
    console.log(`${YELLOW}⚠️  SERIOUS ISSUES (${issues.serious.length}):${RESET}`);
    issues.serious.forEach(issue => {
      console.log(`  ${YELLOW}•${RESET} ${issue.file}`);
      console.log(`    ${issue.issue}`);
    });
    console.log('');
  }
  
  if (issues.warnings.length > 0) {
    console.log(`${YELLOW}⚠️  WARNINGS (${issues.warnings.length}):${RESET}`);
    issues.warnings.forEach(issue => {
      console.log(`  ${YELLOW}•${RESET} ${issue.file}`);
      console.log(`    ${issue.issue}`);
    });
    console.log('');
  }
  
  if (issues.critical.length === 0 && issues.serious.length === 0 && issues.warnings.length === 0) {
    console.log(`${GREEN}✅ No security issues found!${RESET}\n`);
    process.exit(0);
  } else {
    const exitCode = issues.critical.length > 0 ? 1 : 0;
    console.log(`\n${exitCode === 1 ? RED : YELLOW}Audit completed with ${issues.critical.length} critical, ${issues.serious.length} serious, and ${issues.warnings.length} warnings.${RESET}\n`);
    process.exit(exitCode);
  }
}

main();


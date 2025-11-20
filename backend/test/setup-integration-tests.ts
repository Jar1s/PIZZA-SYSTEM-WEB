/**
 * Setup file for integration tests
 * This runs before all integration tests
 */

beforeAll(() => {
  // Warn if using production database
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
  
  if (dbUrl && !dbUrl.includes('test') && !dbUrl.includes('TEST')) {
    console.warn(
      '⚠️  WARNING: Integration tests are using a non-test database!',
      '\n   Set TEST_DATABASE_URL to a dedicated test database to avoid data loss.',
      '\n   Current database:', dbUrl.split('@')[1] || 'unknown'
    );
  }
  
  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL or TEST_DATABASE_URL must be set for integration tests'
    );
  }
});






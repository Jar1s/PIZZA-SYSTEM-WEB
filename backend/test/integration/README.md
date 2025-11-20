# Integration Tests

These integration tests use a **real database** to test Prisma queries, database constraints, and actual data persistence.

## ⚠️ Important: Use a Test Database

**NEVER run these tests against your production database!** They will create, modify, and delete data.

## Setup

1. **Create a test database:**
   ```bash
   # PostgreSQL example
   createdb pizza_ecosystem_test
   ```

2. **Set the test database URL:**
   ```bash
   # Option 1: Use TEST_DATABASE_URL (recommended)
   export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem_test?schema=public"
   
   # Option 2: Use DATABASE_URL (will show warning)
   export DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem_test?schema=public"
   ```

3. **Run migrations on test database:**
   ```bash
   # Set DATABASE_URL to test database temporarily
   export DATABASE_URL="postgresql://user:password@localhost:5432/pizza_ecosystem_test?schema=public"
   npm run prisma:migrate
   ```

## Running Tests

```bash
# Run all integration tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.integration.spec.ts

# Run with coverage
npm run test:cov
```

## What These Tests Cover

### Auth Integration Tests (`auth.integration.spec.ts`)
- ✅ User creation with unique constraints (username, email)
- ✅ Database constraint enforcement (unique emails, required fields)
- ✅ Password validation and hashing
- ✅ Refresh token creation and management
- ✅ Foreign key constraints

### Orders Integration Tests (`orders.integration.spec.ts`)
- ✅ Order creation with real database
- ✅ Order items linked to orders (foreign keys)
- ✅ Order status updates
- ✅ Querying orders by status, tenant, date range
- ✅ Database index performance (tenantId + createdAt)

## Test Structure

Each test file:
1. **Sets up** test data (users, products, tenants)
2. **Runs tests** against real database
3. **Cleans up** test data after completion

## Troubleshooting

### "TEST_DATABASE_URL must be set"
- Set `TEST_DATABASE_URL` environment variable
- Or set `DATABASE_URL` (will show warning)

### "Database connection failed"
- Check database is running
- Verify connection string is correct
- Ensure database exists

### "Unique constraint violation"
- Tests may have left data from previous run
- Clean up test database: `TRUNCATE TABLE users, orders, products CASCADE;`

### Tests are slow
- Normal for integration tests (they hit real database)
- Consider using faster test database (e.g., SQLite for testing)

## Best Practices

1. **Always use a dedicated test database**
2. **Run migrations before tests** to ensure schema is up to date
3. **Clean up test data** after test runs (tests do this automatically)
4. **Don't run in CI/CD without proper test database setup**






# Code Review Checklist

## 🔒 Security

- [ ] No hardcoded secrets (passwords, API keys, tokens)
- [ ] Webhook signature verification is enabled (unless explicitly skipped via `SKIP_WEBHOOK_VERIFICATION`)
- [ ] No SQL injection risks (raw queries use parameterized queries)
- [ ] Authentication/authorization checks are in place
- [ ] Input validation is performed on all user inputs
- [ ] No sensitive data in console logs
- [ ] CORS configuration is correct (not too permissive)

## 🐛 Critical Bugs

- [ ] SMS verification is properly implemented (or explicitly disabled)
- [ ] Modifier prices are calculated correctly (not hardcoded to 0)
- [ ] Tax rate is read from configuration (not hardcoded)
- [ ] Storyous sync failures are logged and alerted (not silent)
- [ ] Error handling is present for all async operations

## 📝 Code Quality

- [ ] Type safety: Minimal use of `as any` (prefer proper types)
- [ ] No code duplication (use utility functions)
- [ ] Configuration values are centralized (not hardcoded)
- [ ] Tenant-specific code is in configuration (not in code)
- [ ] Error messages are user-friendly
- [ ] Logging is appropriate (not too verbose, not too sparse)

## 🎨 Frontend

- [ ] SEO: Server Components for initial data loading (not just `useEffect`)
- [ ] No tenant-specific styling hardcoded (use tenant theme)
- [ ] Loading states are handled
- [ ] Error boundaries are in place
- [ ] Accessibility: ARIA labels, keyboard navigation

## 🧪 Testing

- [ ] Critical paths are tested
- [ ] Edge cases are handled
- [ ] Error scenarios are tested

## 📚 Documentation

- [ ] Complex logic is commented
- [ ] API endpoints are documented
- [ ] Environment variables are documented

## 🚀 Performance

- [ ] No unnecessary re-renders
- [ ] Database queries are optimized
- [ ] Large files are not loaded unnecessarily

## Checklist for Specific Areas

### Backend Services
- [ ] Uses proper TypeScript types (not `as any`)
- [ ] Error handling with proper HTTP status codes
- [ ] Logging includes context (orderId, tenantId, etc.)
- [ ] Database transactions are used where needed

### Frontend Components
- [ ] Uses Server Components where possible (for SEO)
- [ ] Client Components are marked with `'use client'`
- [ ] Loading and error states are handled
- [ ] No hardcoded tenant-specific logic

### Database
- [ ] Migrations are reversible
- [ ] Indexes are added for frequently queried fields
- [ ] Foreign key constraints are in place

### API Endpoints
- [ ] Input validation (DTOs with class-validator)
- [ ] Proper HTTP status codes
- [ ] Error responses are consistent
- [ ] Rate limiting considered (if needed)


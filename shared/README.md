# Shared Types

TypeScript interfaces used across frontend and backend.

## Usage

### In Backend (NestJS)
```typescript
import { Tenant, Product, Order } from '../shared';
```

### In Frontend (Next.js)
```typescript
import { Tenant, Product, Order } from '@/shared';
```

## Updating Types
1. Make changes in this folder
2. Run `npm run type-check`
3. Commit to `feat/shared-types` branch
4. Notify dependent agents



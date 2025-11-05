---

## ⚙️ `RULES.md`

```markdown
# Development & Collaboration Rules

## 1. Structure
- `/frontend` → Next.js 14 app
- `/backend` → NestJS API
- `/shared` → interfaces / schemas
- `/docs` → PRD, RULES, CHANGELOG, DEBUGFILE

## 2. Git Workflow
1. `main` = stable  
2. `dev` = integration  
3. feature branches → `feat/short-description`
4. PRs must:
   - pass lint + tests
   - update `CHANGELOG.md`
   - reference issue ID

## 3. Code Style
- ESLint + Prettier enforced
- TypeScript strict mode ON
- Tailwind for styling
- Descriptive naming (`useOrderStatus`, `TenantTheme`)

## 4. Commits
Format: `type(scope): message` 

feat(payment): add Adyen redirect
fix(delivery): handle Wolt cancel webhook
docs(readme): add deployment steps 

## 5. Environment
- `.env.example` must stay updated
- Never commit secrets
- Use staging keys for PSP / Wolt

## 6. Testing
- Unit → Vitest / Jest
- E2E → Playwright
- Mock Wolt / Payment webhooks

## 7. CI/CD
- Auto-deploy preview on PR (Vercel)
- Run migrations before release
- Rollback script included

## 8. Documentation
- Update `CHANGELOG.md` each merge
- Log all runtime issues in `DEBUGFILE.md`

## 9. Ownership
- `@admin` → global infra & deployments
- `@frontend` → UI/UX + Next.js
- `@backend` → API + DB + integrations

## 10. Communication
- All architectural changes → PR discussion
- All production bugs → `debug/` branch + entry in `DEBUGFILE.md` 


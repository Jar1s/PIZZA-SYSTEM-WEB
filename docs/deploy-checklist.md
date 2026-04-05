# Deploy Checklist

Use this before merging or shipping changes.

## Frontend
- Confirm the PR has a Vercel preview URL.
- Verify the build passed in CI.
- Check the public storefront loads with images, logo, and hero assets.
- Confirm the admin dashboard loads without runtime errors.

## Backend
- Confirm the PR has a Render staging or safe preview path when the change touches integrations or migrations.
- Verify the backend build and tests passed in CI.
- Apply database migrations before deploy if the PR includes schema changes.
- Redeploy the backend before the frontend when an API contract changes.

## Database
- Confirm the migration is idempotent or safe to re-run.
- Record any manual SQL step that cannot be automated.
- Note whether admin settings or mappings must be updated after deploy.

## Release order
- Database first, if needed.
- Backend second.
- Frontend last.

## Final check
- Run the smoke tests in `docs/smoke-tests.md`.
- Do not mark the release complete until the critical flows pass.

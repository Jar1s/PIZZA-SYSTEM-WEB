# DB Migration Checklist

Use this for every schema change.

## Before migration
- Describe the table, column, index, or constraint change.
- Confirm whether the migration is additive, destructive, or data-migrating.
- Check whether the migration can run safely more than once.

## During migration
- Prefer additive changes first.
- Avoid renaming or dropping fields in the same step as a behavior change.
- Keep the migration focused on one concern.

## After migration
- Confirm the backend still boots and builds.
- Confirm any required admin settings or mappings are populated.
- Confirm the related smoke test passes.

## Rollback notes
- If the migration is not reversible, document the fallback.
- If the migration requires manual SQL, record the exact command in the PR.

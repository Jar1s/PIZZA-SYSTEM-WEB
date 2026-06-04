# Database backups (Supabase Free + Render Cron)

Supabase Free does not give you managed database backups. This project therefore
uses an independent **Render Cron Job** that runs `pg_dump`, verifies the dump,
encrypts it with GPG AES-256, and uploads it to S3-compatible storage
(AWS S3 or Backblaze B2).

The GitHub Actions backup workflow was removed on purpose: production DB
credentials should live in Render for this setup, not in GitHub Actions.

## What is in this repo

- [`scripts/backup-db.sh`](../scripts/backup-db.sh) - backup script
- [`backup/Dockerfile`](../backup/Dockerfile) - pinned backup runtime with
  PostgreSQL 17 client, `pg_restore`, `gpg`, and `awscli`
- [`render.yaml`](../render.yaml) - Render Cron Job definition:
  `pizza-db-backup`, daily at `02:00 UTC`

The script:

1. runs `pg_dump -Fc` against Supabase
2. validates the archive with `pg_restore --list`
3. rejects empty/suspicious dumps
4. encrypts the dump with `BACKUP_GPG_PASSPHRASE`
5. uploads `.dump.gpg` and `.sha256` to your S3/B2 bucket

By default it **does not delete old backups**. Set retention/lifecycle rules in
the bucket instead. This lets the storage key avoid delete permissions.

## Render environment variables

Set these in the Render Cron Job service:

| Env var | Required | Value |
|---|---:|---|
| `SUPABASE_DB_URL` | yes | Supabase Session Pooler URI, port `5432` |
| `BACKUP_GPG_PASSPHRASE` | yes | Long random passphrase, stored in password manager |
| `BACKUP_S3_ACCESS_KEY_ID` | yes | S3/B2 access key |
| `BACKUP_S3_SECRET_ACCESS_KEY` | yes | S3/B2 secret key |
| `BACKUP_S3_BUCKET` | yes | Bucket name, e.g. `pizza-db-backups` |
| `BACKUP_S3_REGION` | yes | Region, e.g. `eu-central-003` for B2 |
| `BACKUP_S3_ENDPOINT` | B2/non-AWS only | e.g. `https://s3.eu-central-003.backblazeb2.com` |
| `BACKUP_S3_PREFIX` | no | Defaults to `postgres` |
| `BACKUP_RETENTION_DAYS` | no | Defaults to `30`; used only if pruning is enabled |
| `BACKUP_PRUNE_ENABLED` | no | Defaults to `false`; keep false if bucket lifecycle handles retention |

## Supabase connection string

Use the **Session Pooler** connection string, not the direct connection and not
the transaction pooler.

Supabase dashboard -> **Connect** -> **Connection string** -> **Session pooler**:

```text
postgresql://postgres.<project-ref>:<DB-PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Important:

- port must be `5432`
- do not use `6543`, because transaction poolers are not suitable for `pg_dump`
- if your password has special characters, URL-encode it in the connection string

## Backblaze B2 setup

Recommended for this project:

1. Create a private B2 bucket, e.g. `pizza-db-backups`.
2. Add a lifecycle rule: delete objects older than 30 days.
3. Create an Application Key limited to this bucket.
4. Prefer permissions that allow write/list/read but avoid delete if lifecycle
   handles retention.
5. Put the key values into the Render Cron Job env vars.

Example B2 endpoint:

```text
https://s3.eu-central-003.backblazeb2.com
```

## Render setup

Option A - Blueprint:

1. Push `render.yaml` to GitHub.
2. Render Dashboard -> **Blueprints** -> apply/update the blueprint for this repo.
3. Fill the `sync: false` env vars for `pizza-db-backup`.
4. Open the `pizza-db-backup` Cron Job and click **Trigger Run**.
5. Confirm a `.dump.gpg` and `.sha256` appeared in the bucket.

Option B - Manual Cron Job:

1. Render Dashboard -> **New** -> **Cron Job**.
2. Connect `Jar1s/PIZZA-SYSTEM-WEB`.
3. Runtime: Docker.
4. Dockerfile path: `./backup/Dockerfile`.
5. Docker context: `.`.
6. Command: `/app/scripts/backup-db.sh`.
7. Schedule: `0 2 * * *`.
8. Add the env vars from the table above.

## Restore

```bash
# 1. Download backup + checksum
aws s3 cp s3://<bucket>/postgres/YYYY/MM/DD/backup-<stamp>.dump.gpg . \
  [--endpoint-url <endpoint>]
aws s3 cp s3://<bucket>/postgres/YYYY/MM/DD/backup-<stamp>.dump.gpg.sha256 . \
  [--endpoint-url <endpoint>]

# 2. Verify checksum
sha256sum -c backup-<stamp>.dump.gpg.sha256

# 3. Decrypt
gpg --batch --yes --decrypt --passphrase "<BACKUP_GPG_PASSPHRASE>" \
  --output backup.dump backup-<stamp>.dump.gpg

# 4. Restore into a target database
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname "<TARGET_DATABASE_URL>" backup.dump
```

## Operational rule

A backup that has never been restored is not a backup. After the first successful
Render run, restore the dump into a temporary database and confirm key tables:
`tenants`, `users`, `orders`, `order_items`, `deliveries`,
`storyous_modifier_mappings`.

# Database backups (Supabase Free + Render Cron + Cloudflare R2)

Supabase Free does not give you managed database backups. This project therefore
uses a Render Cron Job that runs `pg_dump`, verifies the dump, encrypts it with
GPG AES-256, and uploads it to **Cloudflare R2** using its S3-compatible API.

The uploaded file is encrypted before it leaves Render. R2 stores only encrypted
`.dump.gpg` files and checksum files.

## What is in this repo

- [`scripts/backup-db.sh`](../scripts/backup-db.sh) - backup script
- [`backup/Dockerfile`](../backup/Dockerfile) - backup runtime with PostgreSQL 17
  client, `pg_restore`, `gpg`, and `awscli`
- [`render.yaml`](../render.yaml) - Render Cron Job definition:
  `pizza-db-backup`, daily at `02:00 UTC`

The script:

1. runs `pg_dump -Fc` against Supabase
2. validates the archive with `pg_restore --list`
3. rejects empty/suspicious dumps
4. encrypts the dump with `BACKUP_GPG_PASSPHRASE`
5. uploads `.dump.gpg` and `.sha256` to Cloudflare R2

## Render environment variables

Set these in the Render Cron Job service:

| Env var | Required | Value |
|---|---:|---|
| `BACKUP_TARGET` | yes | `s3` |
| `SUPABASE_DB_URL` | yes | Supabase Session Pooler URI, port `5432` |
| `BACKUP_GPG_PASSPHRASE` | yes | Long random passphrase, stored in password manager |
| `BACKUP_S3_ACCESS_KEY_ID` | yes | Cloudflare R2 access key ID |
| `BACKUP_S3_SECRET_ACCESS_KEY` | yes | Cloudflare R2 secret access key |
| `BACKUP_S3_BUCKET` | yes | `pizza-db-backups` |
| `BACKUP_S3_REGION` | yes | `auto` |
| `BACKUP_S3_ENDPOINT` | yes | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `BACKUP_S3_PREFIX` | no | Defaults to `postgres` |
| `BACKUP_RETENTION_DAYS` | no | Defaults to `30`; used only if pruning is enabled |
| `BACKUP_PRUNE_ENABLED` | no | Defaults to `false`; keep false unless the token may delete objects |

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

## Cloudflare R2 setup

1. Open Cloudflare Dashboard -> **R2 Object Storage**.
2. Create a bucket:

```text
pizza-db-backups
```

3. Copy your Account ID. It is used in the endpoint:

```text
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

4. Create an R2 API token / access key.

Recommended permissions for the first test:

- Object Read
- Object Write
- Bucket read/list

Do **not** grant delete permission unless you intentionally enable pruning.
This repo defaults `BACKUP_PRUNE_ENABLED=false`, so delete is not needed.

5. Put the R2 values into the Render Cron Job env vars.

## Render setup

Option A - Blueprint:

1. Push `render.yaml` to GitHub.
2. Render Dashboard -> **Blueprints** -> apply/update the blueprint for this repo.
3. Fill these secrets for `pizza-db-backup`:

```text
SUPABASE_DB_URL
BACKUP_GPG_PASSPHRASE
BACKUP_S3_ACCESS_KEY_ID
BACKUP_S3_SECRET_ACCESS_KEY
BACKUP_S3_ENDPOINT
```

`BACKUP_TARGET=s3`, `BACKUP_S3_BUCKET=pizza-db-backups`, and
`BACKUP_S3_REGION=auto` are already set in `render.yaml`.

4. Open the `pizza-db-backup` Cron Job and click **Trigger Run**.
5. Confirm encrypted backup files appeared in the R2 bucket.

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
# 1. Download backup + checksum from R2
aws s3 cp s3://pizza-db-backups/postgres/YYYY/MM/DD/backup-<stamp>.dump.gpg . \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
aws s3 cp s3://pizza-db-backups/postgres/YYYY/MM/DD/backup-<stamp>.dump.gpg.sha256 . \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

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

# Database backups (Supabase Free + Render Cron + Google Drive)

Supabase Free does not give you managed database backups. This project therefore
uses a Render Cron Job that runs `pg_dump`, verifies the dump, encrypts it with
GPG AES-256, and uploads it to your Google Drive.

The GitHub Actions backup workflow was removed on purpose: production DB
credentials should live in Render for this setup, not in GitHub Actions.

## What is in this repo

- [`scripts/backup-db.sh`](../scripts/backup-db.sh) - backup script
- [`backup/Dockerfile`](../backup/Dockerfile) - backup runtime with PostgreSQL 17
  client, `pg_restore`, `gpg`, `rclone`, and `awscli`
- [`render.yaml`](../render.yaml) - Render Cron Job definition:
  `pizza-db-backup`, daily at `02:00 UTC`

The script:

1. runs `pg_dump -Fc` against Supabase
2. validates the archive with `pg_restore --list`
3. rejects empty/suspicious dumps
4. encrypts the dump with `BACKUP_GPG_PASSPHRASE`
5. uploads `.dump.gpg` and `.sha256` to Google Drive

The uploaded file is encrypted before it leaves Render. Google Drive only stores
the encrypted `.gpg` file.

## Render environment variables

Set these in the Render Cron Job service:

| Env var | Required | Value |
|---|---:|---|
| `BACKUP_TARGET` | yes | `google_drive` |
| `SUPABASE_DB_URL` | yes | Supabase Session Pooler URI, port `5432` |
| `BACKUP_GPG_PASSPHRASE` | yes | Long random passphrase, stored in password manager |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64` | yes | Base64 encoded Google service account JSON |
| `GOOGLE_DRIVE_FOLDER_ID` | yes | `11aOtnxPUY-bicyJmNa4ts9tRLO9uJXtE` |
| `BACKUP_S3_PREFIX` | no | Defaults to `postgres`; also used as Drive folder prefix |

S3/B2 env vars still exist as fallback if `BACKUP_TARGET=s3`, but the intended
setup for this project is Google Drive.

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

## Google Drive setup

This uses a Google Cloud **service account**. The service account gets access only
to one Drive folder that you explicitly share with it.

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create/select a project, e.g. `pizza-db-backups`.
3. Enable **Google Drive API** for that project.
4. Create a **Service Account**.
5. Create a JSON key for that service account and download it.
6. In your Google Drive, create a folder, e.g. `Pizza DB Backups`.
7. Share that folder with the service account email from the JSON file. It looks
   like `something@project.iam.gserviceaccount.com`.
8. This project is configured to upload to this Drive folder:

```text
https://drive.google.com/drive/folders/11aOtnxPUY-bicyJmNa4ts9tRLO9uJXtE
```

9. Convert the downloaded JSON key to base64 locally:

```bash
base64 -i service-account.json | tr -d '\n'
```

Put that value into Render as `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64`.
Do not commit the JSON key to git.

## Render setup

Option A - Blueprint:

1. Push `render.yaml` to GitHub.
2. Render Dashboard -> **Blueprints** -> apply/update the blueprint for this repo.
3. Fill the `sync: false` env vars for `pizza-db-backup`.
4. Open the `pizza-db-backup` Cron Job and click **Trigger Run**.
5. Confirm encrypted backup files appeared in your Google Drive folder.

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
# 1. Download backup + checksum from Google Drive
# Use Drive UI, rclone, or Google Takeout/admin tooling.

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

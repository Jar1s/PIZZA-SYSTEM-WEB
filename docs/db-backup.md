# Database backups (Supabase)

Two layers protect the production database:

1. **Supabase managed backups** — enable in the Supabase dashboard (see below).
2. **Independent off-provider backup** — [`.github/workflows/db-backup.yml`](../.github/workflows/db-backup.yml)
   runs daily, dumps with `pg_dump`, verifies + encrypts (GPG AES-256) and uploads to
   S3-compatible storage. This protects you even if the Supabase account/project is lost.

---

## 1. Supabase managed backups (do this first)

In the Supabase dashboard → **Database → Backups**:

- **Pro plan**: daily backups are automatic (7-day retention).
- **Point-in-Time Recovery (PITR)** add-on: lets you restore to any second — strongly
  recommended for a system taking live orders/payments.
- **Free plan has NO backups.** If production is on Free, upgrading is the single most
  important step here.

---

## 2. Independent backup workflow — setup

### a) Get the right connection string ⚠️ important

GitHub Actions runners are **IPv4-only**, but the Supabase *direct* connection
(`db.<ref>.supabase.co:5432`) is **IPv6-only**. So you must use the **Session Pooler**
string (IPv4), not the direct one and not the transaction pooler.

Supabase dashboard → **Connect** (or Project Settings → Database) → **Connection string** →
choose **Session pooler** → copy the URI. It looks like:

```
postgresql://postgres.<project-ref>:<DB-PASSWORD>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

- Port must be **5432** (session pooler), NOT 6543 (transaction pooler — breaks `pg_dump`).
- Put your real DB password in place of `<DB-PASSWORD>`.

### b) Add GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Required | Value |
|--------|----------|-------|
| `SUPABASE_DB_URL` | ✅ | The Session Pooler URI from step (a) |
| `BACKUP_GPG_PASSPHRASE` | ✅ | A long random passphrase (store it in your password manager!) |
| `BACKUP_S3_ACCESS_KEY_ID` | ✅ | Storage access key |
| `BACKUP_S3_SECRET_ACCESS_KEY` | ✅ | Storage secret key |
| `BACKUP_S3_BUCKET` | ✅ | Bucket name (e.g. `pizza-db-backups`) |
| `BACKUP_S3_REGION` | ✅ | e.g. `eu-central-1` (AWS) or your B2 region |
| `BACKUP_S3_ENDPOINT` | optional | Only for non-AWS, e.g. Backblaze B2: `https://s3.eu-central-003.backblazeb2.com` |

> ⚠️ Without `BACKUP_GPG_PASSPHRASE` you **cannot decrypt** the backups. Losing it = losing
> the backups. Store it somewhere safe and separate from the repo.

### c) Storage options

- **Backblaze B2** (cheapest, ~$6/TB/month): create a bucket + application key, set
  `BACKUP_S3_ENDPOINT` to the B2 S3 endpoint.
- **AWS S3**: create a bucket in a private region, an IAM user limited to that bucket, leave
  `BACKUP_S3_ENDPOINT` empty.
- Recommended: enable a **bucket lifecycle/versioning** rule too, and block public access.

### d) Run it

- Manual test: Actions tab → **DB Backup** → **Run workflow**.
- Then it runs automatically every day at 02:00 UTC.

---

## 3. Restore (disaster recovery)

```bash
# 1. Download the encrypted backup
aws s3 cp s3://<bucket>/postgres/YYYY/MM/DD/backup-<stamp>.dump.gpg . \
  [--endpoint-url <endpoint>]

# 2. Decrypt
gpg --batch --yes --decrypt --passphrase "<BACKUP_GPG_PASSPHRASE>" \
  --output backup.dump backup-<stamp>.dump.gpg

# 3. Restore into a target database (e.g. a fresh Supabase project / local Postgres)
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname "<TARGET_DATABASE_URL>" backup.dump
```

## 4. Test the restore (do this once, then quarterly)

A backup you have never restored is not a backup. At least once, restore the latest dump
into a throwaway database and confirm row counts in key tables (`orders`, `users`,
`product_mappings`, `tenants`). Schedule a reminder to repeat this every quarter.

## 5. Optional hardening

- Add a failure alert (the repo already documents Telegram in
  [`telegram-notifications.md`](./telegram-notifications.md)) — GitHub also emails on failed runs by default.
- Consider a second weekly copy to a different storage provider/region.
- Encrypt at rest on the bucket and restrict the storage key to write+list only (no delete)
  if you prefer lifecycle-based pruning over the workflow's prune step.

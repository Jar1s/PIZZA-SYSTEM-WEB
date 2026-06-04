#!/usr/bin/env bash
set -euo pipefail

backup_target="${BACKUP_TARGET:-google_drive}"

required=(
  SUPABASE_DB_URL
  BACKUP_GPG_PASSPHRASE
)

case "$backup_target" in
  google_drive)
    required+=(
      GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64
      GOOGLE_DRIVE_FOLDER_ID
    )
    ;;
  s3)
    required+=(
      BACKUP_S3_ACCESS_KEY_ID
      BACKUP_S3_SECRET_ACCESS_KEY
      BACKUP_S3_BUCKET
      BACKUP_S3_REGION
    )
    ;;
  *)
    echo "Unsupported BACKUP_TARGET: $backup_target. Use google_drive or s3." >&2
    exit 1
    ;;
esac

missing=()
for var in "${required[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "Missing required backup env vars: ${missing[*]}" >&2
  exit 1
fi

export PGSSLMODE="${PGSSLMODE:-require}"

backup_prefix="${BACKUP_S3_PREFIX:-postgres}"
retention_days="${BACKUP_RETENTION_DAYS:-30}"
prune_enabled="${BACKUP_PRUNE_ENABLED:-false}"
workdir="$(mktemp -d)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
date_path="$(date -u +%Y/%m/%d)"
dump_file="$workdir/backup-${stamp}.dump"
encrypted_file="${dump_file}.gpg"
checksum_file="${encrypted_file}.sha256"
service_account_file="$workdir/google-service-account.json"
rclone_config_file="$workdir/rclone.conf"

cleanup() {
  rm -rf "$workdir"
}
trap cleanup EXIT

echo "Starting PostgreSQL backup at $stamp"
echo "Backup target: $backup_target"

pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file "$dump_file"

objects="$(pg_restore --list "$dump_file" | grep -cE '^[0-9]+;' || true)"
size_bytes="$(stat -c%s "$dump_file")"
echo "Dump verification: objects=$objects size=${size_bytes}B"

if [[ "$size_bytes" -lt 1024 ]]; then
  echo "Dump is suspiciously small (<1KB), refusing to upload" >&2
  exit 1
fi

if [[ "$objects" -lt 1 ]]; then
  echo "Dump contains no restorable objects, refusing to upload" >&2
  exit 1
fi

gpg --batch --yes --symmetric --cipher-algo AES256 \
  --passphrase "$BACKUP_GPG_PASSPHRASE" \
  --output "$encrypted_file" "$dump_file"

sha256sum "$encrypted_file" > "$checksum_file"
rm -f "$dump_file"

backup_key="${backup_prefix}/${date_path}/backup-${stamp}.dump.gpg"
checksum_key="${backup_key}.sha256"

if [[ "$backup_target" == "google_drive" ]]; then
  printf '%s' "$GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON_BASE64" | base64 -d > "$service_account_file"
  cat > "$rclone_config_file" <<EOF
[gdrive]
type = drive
scope = drive.file
service_account_file = $service_account_file
root_folder_id = $GOOGLE_DRIVE_FOLDER_ID
EOF

  rclone --config "$rclone_config_file" copyto "$encrypted_file" "gdrive:${backup_key}" --drive-stop-on-upload-limit
  rclone --config "$rclone_config_file" copyto "$checksum_file" "gdrive:${checksum_key}" --drive-stop-on-upload-limit
  echo "Uploaded encrypted backup and checksum to Google Drive folder ${GOOGLE_DRIVE_FOLDER_ID}"
  echo "Pruning is intentionally disabled for Google Drive. Use manual cleanup or Drive retention tooling."
else
  export AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID"
  export AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_ACCESS_KEY"
  export AWS_DEFAULT_REGION="$BACKUP_S3_REGION"

  endpoint_arg=()
  if [[ -n "${BACKUP_S3_ENDPOINT:-}" ]]; then
    endpoint_arg=(--endpoint-url "$BACKUP_S3_ENDPOINT")
  fi

  aws s3 cp "$encrypted_file" "s3://${BACKUP_S3_BUCKET}/${backup_key}" \
    "${endpoint_arg[@]}" --only-show-errors
  aws s3 cp "$checksum_file" "s3://${BACKUP_S3_BUCKET}/${checksum_key}" \
    "${endpoint_arg[@]}" --only-show-errors
  echo "Uploaded encrypted backup and checksum to S3-compatible storage"

  if [[ "$prune_enabled" == "true" ]]; then
    echo "Pruning backups older than ${retention_days} days"
    cutoff="$(date -u -d "${retention_days} days ago" +%s)"
    aws s3 ls "s3://${BACKUP_S3_BUCKET}/${backup_prefix}/" --recursive "${endpoint_arg[@]}" \
      | while read -r date_part _time_part _size key; do
          [[ -z "$key" ]] && continue
          file_date="$(date -u -d "$date_part" +%s 2>/dev/null || echo 0)"
          if [[ "$file_date" -gt 0 && "$file_date" -lt "$cutoff" ]]; then
            echo "Pruning old backup object: $key"
            aws s3 rm "s3://${BACKUP_S3_BUCKET}/${key}" "${endpoint_arg[@]}" --only-show-errors || true
          fi
        done
  else
    echo "Pruning disabled. Use bucket lifecycle retention for deleting old backups."
  fi
fi

echo "Backup completed successfully"

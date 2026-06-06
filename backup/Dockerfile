FROM postgres:17-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    awscli \
    bash \
    ca-certificates \
    coreutils \
    gnupg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY scripts/backup-db.sh /app/scripts/backup-db.sh
RUN chmod +x /app/scripts/backup-db.sh

CMD ["/app/scripts/backup-db.sh"]

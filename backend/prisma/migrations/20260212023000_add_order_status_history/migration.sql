-- Track timestamped order status transitions for admin timeline
CREATE TABLE "order_status_history" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- Backfill existing orders so timeline has baseline data:
-- 1) order received at createdAt
INSERT INTO "order_status_history" ("id", "orderId", "status", "createdAt")
SELECT
  ('legacy_' || o."id" || '_pending'),
  o."id",
  'PENDING'::"OrderStatus",
  o."createdAt"
FROM "orders" o;

-- 2) current status at updatedAt (for orders that already progressed)
INSERT INTO "order_status_history" ("id", "orderId", "status", "createdAt")
SELECT
  ('legacy_' || o."id" || '_current'),
  o."id",
  o."status",
  o."updatedAt"
FROM "orders" o
WHERE o."status" <> 'PENDING'::"OrderStatus";

CREATE INDEX "order_status_history_orderId_createdAt_idx"
  ON "order_status_history"("orderId", "createdAt");

CREATE INDEX "order_status_history_orderId_status_idx"
  ON "order_status_history"("orderId", "status");

ALTER TABLE "order_status_history"
  ADD CONSTRAINT "order_status_history_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

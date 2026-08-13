-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'CUSTOMER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "subdomain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "paymentProvider" TEXT NOT NULL DEFAULT 'adyen',
    "theme" JSONB NOT NULL,
    "paymentConfig" JSONB NOT NULL,
    "deliveryConfig" JSONB NOT NULL,
    "emailConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "category" TEXT NOT NULL,
    "image" TEXT,
    "modifiers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "weightGrams" INTEGER,
    "allergens" TEXT[],
    "displayName" TEXT,
    "subHeader" TEXT,
    "tenantOverrides" JSONB DEFAULT '{}',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNumber" INTEGER,
    "clientRequestId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "customer" JSONB NOT NULL,
    "address" JSONB NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paymentRef" TEXT,
    "paymentStatus" TEXT,
    "refundStatus" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundError" TEXT,
    "deliveryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyousOrderId" TEXT,
    "storyousOrderState" TEXT,
    "userId" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_order_counters" (
    "tenantId" TEXT NOT NULL,
    "lastOrderNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_order_counters_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "modifiers" JSONB,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyous_modifier_mappings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "externalAdditionId" TEXT NOT NULL,
    "labelOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storyous_modifier_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'wolt',
    "jobId" TEXT,
    "status" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "quote" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "appleId" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "passwordResetToken" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'SK',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_mappings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalIdentifier" TEXT NOT NULL,
    "internalProductName" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "minOrderCents" INTEGER,
    "postalCodes" TEXT[],
    "cityNames" TEXT[],
    "cityParts" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_fee_tiers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "minDistanceMeters" INTEGER NOT NULL,
    "maxDistanceMeters" INTEGER NOT NULL,
    "deliveryFeeCents" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_fee_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "storyous" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_backups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_isActive_idx" ON "products"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "products_tenantId_category_idx" ON "products"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_tenantId_key" ON "products"("slug", "tenantId");

-- CreateIndex
CREATE INDEX "orders_tenantId_status_idx" ON "orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "orders_tenantId_createdAt_idx" ON "orders"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_tenantId_orderNumber_idx" ON "orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "orders_tenantId_clientRequestId_idx" ON "orders"("tenantId", "clientRequestId");

-- CreateIndex
CREATE INDEX "orders_paymentRef_idx" ON "orders"("paymentRef");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenantId_orderNumber_key" ON "orders"("tenantId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenantId_clientRequestId_key" ON "orders"("tenantId", "clientRequestId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_status_idx" ON "order_status_history"("orderId", "status");

-- CreateIndex
CREATE INDEX "storyous_modifier_mappings_tenantId_idx" ON "storyous_modifier_mappings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "storyous_modifier_mappings_tenantId_optionId_key" ON "storyous_modifier_mappings"("tenantId", "optionId");

-- CreateIndex
CREATE INDEX "deliveries_jobId_idx" ON "deliveries"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_tenantId_email_idx" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "users_tenantId_phone_idx" ON "users"("tenantId", "phone");

-- CreateIndex
CREATE INDEX "users_tenantId_googleId_idx" ON "users"("tenantId", "googleId");

-- CreateIndex
CREATE INDEX "users_tenantId_appleId_idx" ON "users"("tenantId", "appleId");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_passwordResetToken_idx" ON "users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_phone_key" ON "users"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_googleId_key" ON "users"("tenantId", "googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_appleId_key" ON "users"("tenantId", "appleId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "sms_verification_codes_phone_idx" ON "sms_verification_codes"("phone");

-- CreateIndex
CREATE INDEX "sms_verification_codes_code_idx" ON "sms_verification_codes"("code");

-- CreateIndex
CREATE INDEX "sms_verification_codes_expiresAt_idx" ON "sms_verification_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

-- CreateIndex
CREATE INDEX "addresses_userId_isPrimary_idx" ON "addresses"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "product_mappings_tenantId_externalIdentifier_idx" ON "product_mappings"("tenantId", "externalIdentifier");

-- CreateIndex
CREATE INDEX "product_mappings_internalProductName_idx" ON "product_mappings"("internalProductName");

-- CreateIndex
CREATE UNIQUE INDEX "product_mappings_tenantId_externalIdentifier_source_key" ON "product_mappings"("tenantId", "externalIdentifier", "source");

-- CreateIndex
CREATE INDEX "delivery_zones_tenantId_isActive_idx" ON "delivery_zones"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "delivery_zones_tenantId_name_idx" ON "delivery_zones"("tenantId", "name");

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_tenantId_isActive_idx" ON "delivery_fee_tiers"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_tenantId_priority_idx" ON "delivery_fee_tiers"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "delivery_fee_tiers_isActive_priority_idx" ON "delivery_fee_tiers"("isActive", "priority");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "tenant_backups_tenantId_idx" ON "tenant_backups"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_backups_expiresAt_idx" ON "tenant_backups"("expiresAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_order_counters" ADD CONSTRAINT "tenant_order_counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyous_modifier_mappings" ADD CONSTRAINT "storyous_modifier_mappings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_verification_codes" ADD CONSTRAINT "sms_verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mappings" ADD CONSTRAINT "product_mappings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_fee_tiers" ADD CONSTRAINT "delivery_fee_tiers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


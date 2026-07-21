-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "discount_amount" DECIMAL(65,30),
ADD COLUMN     "discount_code" TEXT,
ADD COLUMN     "discount_id" UUID,
ADD COLUMN     "subtotal_amount" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "discounts" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "max_redemptions" INTEGER,
    "max_per_account" INTEGER,
    "min_order_subtotal" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_accounts" (
    "discount_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,

    CONSTRAINT "discount_accounts_pkey" PRIMARY KEY ("discount_id","account_id")
);

-- CreateTable
CREATE TABLE "discount_redemptions" (
    "id" UUID NOT NULL,
    "discount_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "order_id" UUID,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "discount_redemptions_discount_id_account_id_idx" ON "discount_redemptions"("discount_id", "account_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_accounts" ADD CONSTRAINT "discount_accounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_accounts" ADD CONSTRAINT "discount_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;


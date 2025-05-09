/*
  Warnings:

  - Added the required column `storeId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 11.0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Create default store
INSERT INTO "Store" ("id", "name", "address", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000000', 'POS Vougher Default', 'Default Store', CURRENT_TIMESTAMP);

-- AlterTable - Add storeId column with default value
ALTER TABLE "Category" ADD COLUMN "storeId" TEXT;
-- Update existing records to use default store
UPDATE "Category" SET "storeId" = '00000000-0000-0000-0000-000000000000' WHERE "storeId" IS NULL;
-- Make the column required
ALTER TABLE "Category" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable - Add storeId column with default value
ALTER TABLE "Product" ADD COLUMN "storeId" TEXT;
-- Update existing records to use default store
UPDATE "Product" SET "storeId" = '00000000-0000-0000-0000-000000000000' WHERE "storeId" IS NULL;
-- Make the column required
ALTER TABLE "Product" ALTER COLUMN "storeId" SET NOT NULL;

-- AlterTable - Add storeId column with default value
ALTER TABLE "Transaction" ADD COLUMN "storeId" TEXT;
-- Update existing records to use default store
UPDATE "Transaction" SET "storeId" = '00000000-0000-0000-0000-000000000000' WHERE "storeId" IS NULL;
-- Make the column required
ALTER TABLE "Transaction" ALTER COLUMN "storeId" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserStore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KASIR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- Associate all existing users with default store
INSERT INTO "UserStore" ("id", "userId", "storeId", "role", "updatedAt")
SELECT 
  gen_random_uuid(), 
  "id", 
  '00000000-0000-0000-0000-000000000000', 
  "role", 
  CURRENT_TIMESTAMP
FROM "User";

-- CreateIndex
CREATE UNIQUE INDEX "UserStore_userId_storeId_key" ON "UserStore"("userId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSettings_storeId_key_key" ON "StoreSettings"("storeId", "key");

-- AddForeignKey
ALTER TABLE "UserStore" ADD CONSTRAINT "UserStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStore" ADD CONSTRAINT "UserStore_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

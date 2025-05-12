-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'QRIS';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "midtransToken" TEXT;

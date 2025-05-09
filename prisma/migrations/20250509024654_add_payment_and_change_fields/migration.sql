-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "changeAmount" INTEGER NOT NULL DEFAULT 0;

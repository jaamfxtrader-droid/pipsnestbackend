-- CreateEnum
CREATE TYPE "CouponCategory" AS ENUM ('CHALLENGE', 'TOPUP', 'ALL');

-- CreateEnum
CREATE TYPE "TopUpStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TopUpMethod" AS ENUM ('MANUAL', 'BANK', 'CRYPTO', 'CARD');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "category" "CouponCategory" NOT NULL DEFAULT 'CHALLENGE';

-- CreateTable
CREATE TABLE "TopUpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "TopUpMethod" NOT NULL DEFAULT 'MANUAL',
    "status" "TopUpStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "proofUrl" TEXT,
    "adminNote" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopUpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopUpTransaction_userId_createdAt_idx" ON "TopUpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TopUpTransaction_status_idx" ON "TopUpTransaction"("status");

-- AddForeignKey
ALTER TABLE "TopUpTransaction" ADD CONSTRAINT "TopUpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

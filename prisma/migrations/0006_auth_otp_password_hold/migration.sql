-- CreateEnum
CREATE TYPE "UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateEnum
CREATE TYPE "AuthOtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "status" "UserApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN "payoutHoldUntil" TIMESTAMP(3);

UPDATE "User"
SET "status" = CASE
  WHEN "emailVerified" = true THEN 'APPROVED'::"UserApprovalStatus"
  ELSE 'PENDING'::"UserApprovalStatus"
END;

-- CreateTable
CREATE TABLE "AuthOtp" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "purpose" "AuthOtpPurpose" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthOtp_email_purpose_createdAt_idx" ON "AuthOtp"("email", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "AuthOtp_userId_purpose_idx" ON "AuthOtp"("userId", "purpose");

-- AddForeignKey
ALTER TABLE "AuthOtp" ADD CONSTRAINT "AuthOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

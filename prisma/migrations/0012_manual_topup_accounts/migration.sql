-- CreateEnum
CREATE TYPE "ManualFundingAccountType" AS ENUM ('CRYPTO', 'BANK', 'WALLET');

-- AlterTable
ALTER TABLE "TopUpTransaction"
ADD COLUMN "manualFundingAccountId" TEXT,
ADD COLUMN "transactionId" TEXT;

-- CreateTable
CREATE TABLE "ManualFundingAccount" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "accountType" "ManualFundingAccountType" NOT NULL,
  "asset" TEXT,
  "network" TEXT,
  "accountIdentifier" TEXT NOT NULL,
  "holderName" TEXT,
  "instructions" TEXT,
  "minAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ManualFundingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualFundingAccount_isActive_sortOrder_idx" ON "ManualFundingAccount"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "TopUpTransaction_manualFundingAccountId_idx" ON "TopUpTransaction"("manualFundingAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "TopUpTransaction_manualFundingAccountId_transactionId_key" ON "TopUpTransaction"("manualFundingAccountId", "transactionId");

-- AddForeignKey
ALTER TABLE "TopUpTransaction" ADD CONSTRAINT "TopUpTransaction_manualFundingAccountId_fkey" FOREIGN KEY ("manualFundingAccountId") REFERENCES "ManualFundingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed starter manual funding accounts. Replace the identifiers in Admin > Top-ups before accepting real funds.
INSERT INTO "ManualFundingAccount" ("id", "label", "accountType", "asset", "network", "accountIdentifier", "holderName", "instructions", "minAmount", "isActive", "sortOrder")
VALUES
  ('manual_usdt_trc20', 'USDT TRC20 Wallet', 'CRYPTO', 'USDT', 'TRC20', 'UPDATE_IN_ADMIN_USDT_TRC20_ADDRESS', 'PipNest Markets', 'Send only USDT on TRC20. Add the exact transaction ID and upload the receipt.', 10, true, 10),
  ('manual_usdt_bep20', 'USDT BEP20 Wallet', 'CRYPTO', 'USDT', 'BEP20', 'UPDATE_IN_ADMIN_USDT_BEP20_ADDRESS', 'PipNest Markets', 'Send only USDT on BEP20. Add the exact transaction ID and upload the receipt.', 10, true, 20),
  ('manual_bnb_bep20', 'BNB Wallet', 'CRYPTO', 'BNB', 'BEP20', 'UPDATE_IN_ADMIN_BNB_BEP20_ADDRESS', 'PipNest Markets', 'Send only BNB on BEP20. Add the exact transaction ID and upload the receipt.', 10, true, 30),
  ('manual_airtm', 'Airtm Account', 'WALLET', 'USD', 'Airtm', 'UPDATE_IN_ADMIN_AIRTM_ACCOUNT', 'PipNest Markets', 'Send the payment to the listed Airtm account, then submit the transaction ID and receipt.', 10, true, 40),
  ('manual_payoneer', 'Payoneer Account', 'BANK', 'USD', 'Payoneer', 'UPDATE_IN_ADMIN_PAYONEER_ACCOUNT', 'PipNest Markets', 'Send the payment to the listed Payoneer account, then submit the transaction ID and receipt.', 10, true, 50)
ON CONFLICT ("id") DO NOTHING;

-- CreateEnum
CREATE TYPE "ChallengeStage" AS ENUM ('PHASE_1', 'PHASE_2', 'FUNDED');

-- AlterTable
ALTER TABLE "TradingAccount"
ADD COLUMN "stage" "ChallengeStage" NOT NULL DEFAULT 'PHASE_1',
ADD COLUMN "statusReason" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "disabledAt" TIMESTAMP(3),
ADD COLUMN "expiredAt" TIMESTAMP(3);

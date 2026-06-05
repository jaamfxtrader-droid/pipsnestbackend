ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorConfirmedAt" TIMESTAMP(3);

ALTER TABLE "SupportTicket" ADD COLUMN "assignedAdminId" TEXT;

ALTER TABLE "Notification" ADD COLUMN "archivedAt" TIMESTAMP(3);

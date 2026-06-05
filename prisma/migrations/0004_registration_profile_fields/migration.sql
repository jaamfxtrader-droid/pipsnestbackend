ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "registrationDeviceId" TEXT,
  ADD COLUMN IF NOT EXISTS "registrationIp" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "User_registrationDeviceId_key" ON "User"("registrationDeviceId");

CREATE TABLE IF NOT EXISTS "AdminRoleTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "locked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminRoleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminRoleTemplate_name_key" ON "AdminRoleTemplate"("name");

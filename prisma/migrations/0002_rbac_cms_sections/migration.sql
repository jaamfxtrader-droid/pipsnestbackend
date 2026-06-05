ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "CmsSection" (
  "id" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "pageSlug" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "eyebrow" TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CmsSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CmsSection_pageSlug_sectionKey_key" ON "CmsSection"("pageSlug", "sectionKey");
CREATE INDEX IF NOT EXISTS "CmsSection_pageId_idx" ON "CmsSection"("pageId");

ALTER TABLE "CmsSection"
  ADD CONSTRAINT "CmsSection_pageId_fkey"
  FOREIGN KEY ("pageId") REFERENCES "CmsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CmsSection"
  ADD CONSTRAINT "CmsSection_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

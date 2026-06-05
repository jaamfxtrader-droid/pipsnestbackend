-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CMS_EDITOR' AFTER 'ADMIN';

-- AlterTable CmsSection to add new fields
ALTER TABLE "CmsSection" ADD COLUMN "sectionType" VARCHAR(50) NOT NULL DEFAULT 'block',
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "iconName" VARCHAR(100),
ADD COLUMN "colorScheme" VARCHAR(50),
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- Create index for better performance
CREATE INDEX "CmsSection_pageSlug_sortOrder_idx" ON "CmsSection"("pageSlug", "sortOrder");
CREATE INDEX "CmsSection_published_idx" ON "CmsSection"("published");

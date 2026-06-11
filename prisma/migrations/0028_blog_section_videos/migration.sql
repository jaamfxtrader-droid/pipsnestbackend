CREATE TABLE "BlogSectionVideo" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "title" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlogSectionVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlogSectionVideo_sectionId_order_idx" ON "BlogSectionVideo"("sectionId", "order");

ALTER TABLE "BlogSectionVideo" ADD CONSTRAINT "BlogSectionVideo_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BlogSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

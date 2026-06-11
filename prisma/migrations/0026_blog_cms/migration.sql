CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "Blog" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
  "referenceCtaText" TEXT,
  "referenceCtaUrl" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "canonicalUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogImage" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "altText" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlogImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogVideo" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "title" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlogVideo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogSection" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "heading" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlogSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogComment" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "displayName" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentImage" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  CONSTRAINT "CommentImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");
CREATE INDEX "Blog_status_createdAt_idx" ON "Blog"("status", "createdAt");
CREATE INDEX "Blog_category_idx" ON "Blog"("category");
CREATE INDEX "BlogImage_blogId_order_idx" ON "BlogImage"("blogId", "order");
CREATE INDEX "BlogVideo_blogId_order_idx" ON "BlogVideo"("blogId", "order");
CREATE INDEX "BlogSection_blogId_order_idx" ON "BlogSection"("blogId", "order");
CREATE INDEX "BlogComment_blogId_createdAt_idx" ON "BlogComment"("blogId", "createdAt");
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE INDEX "CommentImage_commentId_idx" ON "CommentImage"("commentId");

ALTER TABLE "BlogImage" ADD CONSTRAINT "BlogImage_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogVideo" ADD CONSTRAINT "BlogVideo_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogSection" ADD CONSTRAINT "BlogSection_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentImage" ADD CONSTRAINT "CommentImage_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

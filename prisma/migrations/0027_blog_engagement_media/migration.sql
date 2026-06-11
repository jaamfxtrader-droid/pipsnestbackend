ALTER TABLE "Blog" ADD COLUMN "authorName" TEXT;
ALTER TABLE "Blog" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Blog" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Blog" SET "authorName" = 'PipNest Editorial', "publishedAt" = COALESCE("publishedAt", "createdAt") WHERE "authorName" IS NULL;

CREATE TABLE "BlogAttachment" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "title" TEXT,
  "contentType" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BlogAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogReaction" (
  "id" TEXT NOT NULL,
  "blogId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogCommentReaction" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogCommentReaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BlogComment" ADD COLUMN "parentId" TEXT;

CREATE INDEX "BlogAttachment_blogId_order_idx" ON "BlogAttachment"("blogId", "order");
CREATE UNIQUE INDEX "BlogReaction_blogId_userId_key" ON "BlogReaction"("blogId", "userId");
CREATE INDEX "BlogReaction_blogId_type_idx" ON "BlogReaction"("blogId", "type");
CREATE INDEX "BlogReaction_userId_idx" ON "BlogReaction"("userId");
CREATE UNIQUE INDEX "BlogCommentReaction_commentId_userId_key" ON "BlogCommentReaction"("commentId", "userId");
CREATE INDEX "BlogCommentReaction_commentId_type_idx" ON "BlogCommentReaction"("commentId", "type");
CREATE INDEX "BlogCommentReaction_userId_idx" ON "BlogCommentReaction"("userId");
CREATE INDEX "BlogComment_parentId_idx" ON "BlogComment"("parentId");

ALTER TABLE "BlogAttachment" ADD CONSTRAINT "BlogAttachment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogCommentReaction" ADD CONSTRAINT "BlogCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogCommentReaction" ADD CONSTRAINT "BlogCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BlogComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

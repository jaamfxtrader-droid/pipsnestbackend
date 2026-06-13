import { Prisma } from "@prisma/client";
import { Router } from "express";
import slugify from "slugify";
import { blogCommentSchema, blogSchema, blogStatusSchema, reactionSchema } from "@pipnest/shared";
import { prisma } from "../config/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { uploadBlogCommentImages, uploadBlogImage, uploadBlogMedia } from "../services/cloudinary.service.js";
import { blogLiveEvents } from "../services/blog-live.service.js";
import { HttpError, asyncHandler, sendSuccess } from "../utils/http.js";

const blogInclude = {
  images: { orderBy: { order: "asc" } },
  videos: { orderBy: { order: "asc" } },
  attachments: { orderBy: { order: "asc" } },
  sections: { orderBy: { order: "asc" }, include: { videos: { orderBy: { order: "asc" } } } },
  reactions: { select: { type: true } },
  _count: { select: { comments: true } }
} satisfies Prisma.BlogInclude;

const commentInclude = {
  images: true,
  user: { select: { id: true, name: true, avatarUrl: true } },
  reactions: { select: { type: true } },
  replies: {
    include: {
      images: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
      reactions: { select: { type: true } },
      _count: { select: { reactions: true } }
    },
    orderBy: { createdAt: "asc" }
  },
  _count: { select: { replies: true, reactions: true } }
} satisfies Prisma.BlogCommentInclude;

type BlogImageInput = { imageUrl: string; order?: number; title?: string; caption?: string; altText?: string };
type BlogVideoInput = { videoUrl: string; order?: number; title?: string; caption?: string };
type BlogAttachmentInput = { fileUrl: string; order?: number; title?: string; contentType?: string };
type BlogSectionInput = {
  heading: string;
  content: string;
  imageUrl?: string | null;
  images?: Array<{ imageUrl: string; order?: number }>;
  imagePlacement?: "top" | "middle" | "bottom";
  videos: BlogVideoInput[];
  order?: number;
};

function normalizeSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}

async function uniqueSlug(base: string, excludeId?: string) {
  const normalized = normalizeSlug(base) || "blog-post";
  let candidate = normalized;
  let suffix = 2;

  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
}

function reactionCounts(reactions: Array<{ type: string }>) {
  return {
    likes: reactions.filter((reaction) => reaction.type === "LIKE").length,
    dislikes: reactions.filter((reaction) => reaction.type === "DISLIKE").length
  };
}

function serializeBlog<T extends { reactions?: Array<{ type: string }>; _count?: { comments?: number } }>(blog: T) {
  const { reactions, _count, ...rest } = blog;
  return {
    ...rest,
    stats: {
      comments: _count?.comments ?? 0,
      ...reactionCounts(reactions ?? [])
    }
  };
}

function serializeComment<T extends { reactions?: Array<{ type: string }>; replies?: unknown[] }>(comment: T): Omit<T, "reactions" | "replies"> & { replies: unknown[]; stats: { likes: number; dislikes: number } } {
  const { reactions, replies, ...rest } = comment;
  return {
    ...rest,
    replies: (replies as Array<{ reactions?: Array<{ type: string }> }> | undefined)?.map(serializeComment) ?? [],
    stats: reactionCounts(reactions ?? [])
  };
}

function blogData(input: any) {
  const publishedAt = input.status === "PUBLISHED"
    ? input.publishedAt ? new Date(input.publishedAt) : new Date()
    : input.publishedAt ? new Date(input.publishedAt) : null;

  return {
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription,
    description: input.description,
    content: input.content,
    category: input.category || null,
    tags: input.tags,
    keywords: input.keywords,
    status: input.status,
    referenceCtaText: input.referenceCtaText || null,
    referenceCtaUrl: input.referenceCtaUrl || null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    seoKeywords: input.seoKeywords,
    canonicalUrl: input.canonicalUrl || null,
    authorName: input.authorName || "PipNest Editorial",
    publishedAt
  };
}

function sectionImageConfig(section: { imageUrl?: string | null; images?: Array<{ imageUrl: string; order?: number }>; imagePlacement?: "top" | "middle" | "bottom" }) {
  const images = section.images?.length
    ? section.images.map((image, index) => ({ imageUrl: image.imageUrl, order: image.order ?? index }))
    : section.imageUrl
      ? [{ imageUrl: section.imageUrl, order: 0 }]
      : [];
  if (!images.length) return null;
  return JSON.stringify({ placement: section.imagePlacement ?? "middle", images });
}

async function prepareBlogInput(input: any) {
  return {
    ...input,
    images: await Promise.all(
      (input.images as BlogImageInput[]).map(async (image, index: number) => ({ ...image, imageUrl: (await uploadBlogImage(image.imageUrl)) ?? image.imageUrl, order: image.order ?? index }))
    ),
    videos: await Promise.all(
      (input.videos as BlogVideoInput[]).map(async (video, index: number) => ({ ...video, videoUrl: (await uploadBlogMedia(video.videoUrl)) ?? video.videoUrl, order: video.order ?? index }))
    ),
    attachments: await Promise.all(
      (input.attachments as BlogAttachmentInput[]).map(async (attachment, index: number) => ({ ...attachment, fileUrl: (await uploadBlogMedia(attachment.fileUrl)) ?? attachment.fileUrl, order: attachment.order ?? index }))
    ),
    sections: await Promise.all(
      (input.sections as BlogSectionInput[]).map(async (section, index: number) => {
        const sectionImages = section.images?.length
          ? await Promise.all(section.images.map(async (image: { imageUrl: string; order?: number }, imageIndex: number) => ({ imageUrl: (await uploadBlogImage(image.imageUrl)) ?? image.imageUrl, order: image.order ?? imageIndex })))
          : section.imageUrl
            ? [{ imageUrl: (await uploadBlogImage(section.imageUrl)) ?? section.imageUrl, order: 0 }]
            : [];
        return {
          ...section,
          images: sectionImages,
          imageUrl: sectionImageConfig({ ...section, images: sectionImages }),
          videos: await Promise.all(
            section.videos.map(async (video: BlogVideoInput, videoIndex: number) => ({
              ...video,
              videoUrl: (await uploadBlogMedia(video.videoUrl)) ?? video.videoUrl,
              order: video.order ?? videoIndex
            }))
          ),
          order: section.order ?? index
        };
      })
    )
  };
}

function publicBlogWhere() {
  return { status: "PUBLISHED" as const, images: { some: {} } };
}

export const blogRouter = Router();

blogRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const limit = Math.min(10, Math.max(1, Number(req.query.limit ?? 10) || 10));
    const skip = (page - 1) * limit;
    const where = publicBlogWhere();
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: blogInclude,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit
      }),
      prisma.blog.count({ where })
    ]);

    sendSuccess(res, {
      blogs: blogs.map(serializeBlog),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  })
);

blogRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({
      where: { slug: req.params.slug, status: "PUBLISHED" },
      include: blogInclude
    });
    if (!blog) throw new HttpError(404, "Blog not found");
    const viewed = await prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
      include: blogInclude
    });
    sendSuccess(res, { blog: serializeBlog(viewed) });
  })
);

blogRouter.get(
  "/:slug/next",
  asyncHandler(async (req, res) => {
    const current = await prisma.blog.findUnique({ where: { slug: req.params.slug }, select: { createdAt: true, id: true } });
    if (!current) throw new HttpError(404, "Blog not found");
    const blogs = await prisma.blog.findMany({
      where: { ...publicBlogWhere(), NOT: { id: current.id } },
      include: blogInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12
    });
    sendSuccess(res, { blogs: blogs.map(serializeBlog) });
  })
);

blogRouter.post(
  "/:slug/reaction",
  authenticate,
  validateBody(reactionSchema),
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, select: { id: true } });
    if (!blog) throw new HttpError(404, "Blog not found");
    const existing = await prisma.blogReaction.findUnique({ where: { blogId_userId: { blogId: blog.id, userId: req.user!.id } } });
    if (existing && existing.type === req.body.type) {
      await prisma.blogReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogReaction.upsert({
        where: { blogId_userId: { blogId: blog.id, userId: req.user!.id } },
        create: { blogId: blog.id, userId: req.user!.id, type: req.body.type },
        update: { type: req.body.type }
      });
    }
    const reactions = await prisma.blogReaction.findMany({ where: { blogId: blog.id }, select: { type: true } });
    sendSuccess(res, { stats: reactionCounts(reactions) });
  })
);

blogRouter.get(
  "/:slug/comments",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, select: { id: true } });
    if (!blog) throw new HttpError(404, "Blog not found");
    const comments = await prisma.blogComment.findMany({
      where: { blogId: blog.id, parentId: null },
      include: commentInclude,
      orderBy: { createdAt: "asc" }
    });
    sendSuccess(res, { comments: comments.map(serializeComment) });
  })
);

blogRouter.post(
  "/:slug/comments",
  authenticate,
  validateBody(blogCommentSchema),
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findFirst({ where: { slug: req.params.slug, status: "PUBLISHED" }, select: { id: true, slug: true } });
    if (!blog) throw new HttpError(404, "Blog not found");

    if (req.body.parentId) {
      const parent = await prisma.blogComment.findFirst({ where: { id: req.body.parentId, blogId: blog.id }, select: { id: true } });
      if (!parent) throw new HttpError(404, "Parent comment not found");
    }
    const uploadedImages = await uploadBlogCommentImages(req.body.images);
    const comment = await prisma.blogComment.create({
      data: {
        blogId: blog.id,
        userId: req.user!.id,
        parentId: req.body.parentId || null,
        isAnonymous: req.body.isAnonymous,
        displayName: req.body.displayName || null,
        content: req.body.content,
        images: { create: uploadedImages.map((imageUrl: string) => ({ imageUrl })) }
      },
      include: commentInclude
    });

    const serialized = serializeComment(comment);
    blogLiveEvents.emitComment({ slug: blog.slug, payload: { type: "blog.comment", comment: serialized } });
    sendSuccess(res, { comment: serialized }, 201);
  })
);

blogRouter.post(
  "/comments/:commentId/reaction",
  authenticate,
  validateBody(reactionSchema),
  asyncHandler(async (req, res) => {
    const comment = await prisma.blogComment.findUnique({ where: { id: req.params.commentId }, select: { id: true } });
    if (!comment) throw new HttpError(404, "Comment not found");
    const existing = await prisma.blogCommentReaction.findUnique({ where: { commentId_userId: { commentId: comment.id, userId: req.user!.id } } });
    if (existing && existing.type === req.body.type) {
      await prisma.blogCommentReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogCommentReaction.upsert({
        where: { commentId_userId: { commentId: comment.id, userId: req.user!.id } },
        create: { commentId: comment.id, userId: req.user!.id, type: req.body.type },
        update: { type: req.body.type }
      });
    }
    const reactions = await prisma.blogCommentReaction.findMany({ where: { commentId: comment.id }, select: { type: true } });
    sendSuccess(res, { stats: reactionCounts(reactions) });
  })
);

export const adminBlogRouter = Router();
adminBlogRouter.use(authenticate, requireRole("ADMIN", "SUPER_ADMIN"));

adminBlogRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const blogs = await prisma.blog.findMany({
      include: blogInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });
    sendSuccess(res, { blogs: blogs.map(serializeBlog) });
  })
);

adminBlogRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: blogInclude
    });
    if (!blog) throw new HttpError(404, "Blog not found");
    sendSuccess(res, { blog: serializeBlog(blog) });
  })
);

adminBlogRouter.post(
  "/",
  validateBody(blogSchema),
  asyncHandler(async (req, res) => {
    const input = await prepareBlogInput(blogSchema.parse(req.body));
    input.slug = await uniqueSlug(input.slug || input.title);
    const blog = await prisma.blog.create({
      data: {
        ...blogData(input),
        images: { create: (input.images as BlogImageInput[]).map((image, index: number) => ({ ...image, order: image.order ?? index })) },
        videos: { create: (input.videos as BlogVideoInput[]).map((video, index: number) => ({ ...video, order: video.order ?? index })) },
        attachments: { create: (input.attachments as BlogAttachmentInput[]).map((attachment, index: number) => ({ ...attachment, order: attachment.order ?? index })) },
        sections: {
          create: (input.sections as BlogSectionInput[]).map((section, index: number) => ({
            heading: section.heading,
            content: section.content,
            imageUrl: section.imageUrl || null,
            order: section.order ?? index,
            videos: { create: section.videos.map((video: BlogVideoInput, videoIndex: number) => ({ ...video, order: video.order ?? videoIndex })) }
          }))
        }
      },
      include: blogInclude
    });
    sendSuccess(res, { blog: serializeBlog(blog) }, 201);
  })
);

adminBlogRouter.put(
  "/:id",
  validateBody(blogSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.blog.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existing) throw new HttpError(404, "Blog not found");

    const input = await prepareBlogInput(blogSchema.parse(req.body));
    input.slug = await uniqueSlug(input.slug || input.title, req.params.id);

    const blog = await prisma.$transaction(
      async (tx) => {
        await tx.blogImage.deleteMany({ where: { blogId: req.params.id } });
        await tx.blogVideo.deleteMany({ where: { blogId: req.params.id } });
        await tx.blogAttachment.deleteMany({ where: { blogId: req.params.id } });
        await tx.blogSection.deleteMany({ where: { blogId: req.params.id } });
        return tx.blog.update({
          where: { id: req.params.id },
          data: {
            ...blogData(input),
            images: { create: (input.images as BlogImageInput[]).map((image, index: number) => ({ ...image, order: image.order ?? index })) },
            videos: { create: (input.videos as BlogVideoInput[]).map((video, index: number) => ({ ...video, order: video.order ?? index })) },
            attachments: { create: (input.attachments as BlogAttachmentInput[]).map((attachment, index: number) => ({ ...attachment, order: attachment.order ?? index })) },
            sections: {
              create: (input.sections as BlogSectionInput[]).map((section, index: number) => ({
                heading: section.heading,
                content: section.content,
                imageUrl: section.imageUrl || null,
                order: section.order ?? index,
                videos: { create: section.videos.map((video: BlogVideoInput, videoIndex: number) => ({ ...video, order: video.order ?? videoIndex })) }
              }))
            }
          },
          include: blogInclude
        });
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

    sendSuccess(res, { blog: serializeBlog(blog) });
  })
);

adminBlogRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.blog.delete({ where: { id: req.params.id } });
    sendSuccess(res, { message: "Blog deleted" });
  })
);

adminBlogRouter.patch(
  "/:id/status",
  validateBody(blogStatusSchema),
  asyncHandler(async (req, res) => {
    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: { status: req.body.status, publishedAt: req.body.status === "PUBLISHED" ? new Date() : undefined },
      include: blogInclude
    });
    sendSuccess(res, { blog: serializeBlog(blog) });
  })
);

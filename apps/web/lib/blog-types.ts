export type BlogStatus = "DRAFT" | "PUBLISHED";

export type BlogImage = {
  id?: string;
  imageUrl: string;
  altText?: string | null;
  order: number;
};

export type BlogVideo = {
  id?: string;
  videoUrl: string;
  title?: string | null;
  order: number;
};

export type BlogAttachment = {
  id?: string;
  fileUrl: string;
  title?: string | null;
  contentType?: string | null;
  order: number;
};

export type BlogSection = {
  id?: string;
  heading: string;
  content: string;
  imageUrl?: string | null;
  videos: BlogVideo[];
  order: number;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  content: string;
  category?: string | null;
  tags: string[];
  keywords: string[];
  status: BlogStatus;
  referenceCtaText?: string | null;
  referenceCtaUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords: string[];
  canonicalUrl?: string | null;
  authorName?: string | null;
  viewCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: BlogImage[];
  videos: BlogVideo[];
  attachments: BlogAttachment[];
  sections: BlogSection[];
  stats?: { comments: number; likes: number; dislikes: number };
};

export type BlogComment = {
  id: string;
  blogId: string;
  userId: string;
  parentId?: string | null;
  isAnonymous: boolean;
  displayName?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
  images: Array<{ id: string; imageUrl: string }>;
  replies: BlogComment[];
  stats?: { likes: number; dislikes: number };
};

export type BlogPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

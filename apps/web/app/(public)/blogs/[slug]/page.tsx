import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Blog } from "@/lib/blog-types";
import { BlogDetailClient } from "./blog-detail-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getBlog(slug: string) {
  const response = await fetch(`${API_URL}/blogs/${slug}`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  if (payload.success === false) return null;
  return payload.data.blog as Blog;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  if (!blog) return {};
  const title = blog.seoTitle || blog.title;
  const description = blog.seoDescription || blog.shortDescription || blog.description;
  const image = blog.images[0]?.imageUrl;
  const canonical = blog.canonicalUrl || `${APP_URL}/blogs/${blog.slug}`;

  return {
    title,
    description,
    keywords: blog.seoKeywords.length ? blog.seoKeywords : blog.keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: blog.title }] : undefined,
      type: "article"
    }
  };
}

export default async function BlogSlugPage({ params }: { params: { slug: string } }) {
  const blog = await getBlog(params.slug);
  if (!blog) notFound();
  return <BlogDetailClient blog={blog} />;
}

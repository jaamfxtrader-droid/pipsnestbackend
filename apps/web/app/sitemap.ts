import type { MetadataRoute } from "next";
import { getCmsPages } from "@/lib/cms";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SITE_URL = "https://www.pipnestmarkets.com";

type BlogSitemapItem = {
  slug: string;
  updatedAt?: string;
  publishedAt?: string | null;
};

type BlogListResponse = {
  blogs: BlogSitemapItem[];
  pagination: {
    page: number;
    totalPages: number;
  };
};

type ApiPayload<T> = {
  success: boolean;
  data: T;
};

export const dynamic = "force-dynamic";

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

async function getPublishedBlogs() {
  const blogs: BlogSitemapItem[] = [];
  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await fetch(`${API_URL}/blogs?page=${page}&limit=10`, { cache: "no-store" });
      if (!response.ok) break;
      const payload = (await response.json()) as ApiPayload<BlogListResponse>;
      if (payload.success === false) break;
      blogs.push(...payload.data.blogs);
      totalPages = payload.data.pagination.totalPages;
      page += 1;
    } while (page <= totalPages);
  } catch {
    return blogs;
  }

  return blogs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cmsPages, blogs] = await Promise.all([getCmsPages(), getPublishedBlogs()]);
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: absoluteUrl("/blogs"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    }
  ];

  const cmsRoutes: MetadataRoute.Sitemap = cmsPages
    .filter((page) => page.published !== false && page.slug !== "home")
    .map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    }));

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: absoluteUrl(`/blogs/${blog.slug}`),
    lastModified: new Date(blog.updatedAt ?? blog.publishedAt ?? Date.now()),
    changeFrequency: "weekly",
    priority: 0.7
  }));

  return [...staticRoutes, ...cmsRoutes, ...blogRoutes];
}

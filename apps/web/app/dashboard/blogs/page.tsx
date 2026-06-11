"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Blog, BlogPagination } from "@/lib/blog-types";
import { cn } from "@/lib/utils";

function BlogCard({ blog }: { blog: Blog }) {
  const images = blog.images.slice(0, 6);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0];

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-white/10">
        {image ? (
          <img src={image.imageUrl} alt={image.altText ?? blog.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">No image</div>
        )}
        {images.length > 1 ? (
          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-950 shadow" onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)} aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-950 shadow" onClick={() => setIndex((current) => (current + 1) % images.length)} aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {images.length > 1 ? <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-bold text-white">{index + 1}/{images.length}</span> : null}
      </div>
      <div className="grid gap-4 p-5">
        <div>
          {blog.category ? <div className="text-xs font-black uppercase text-primary">{blog.category}</div> : null}
          <h2 className="mt-2 line-clamp-2 text-xl font-black leading-7">{blog.title}</h2>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{blog.shortDescription || blog.description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {blog.referenceCtaUrl ? (
            <Link href={blog.referenceCtaUrl} target={blog.referenceCtaUrl.startsWith("http") ? "_blank" : undefined} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white">
              <ExternalLink className="h-4 w-4" />
              {blog.referenceCtaText || "Reference"}
            </Link>
          ) : null}
          <Link href={`/blogs/${blog.slug}`} className={cn("inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500", !blog.referenceCtaUrl && "sm:col-span-2")}>
            Open Blog
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function DashboardBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<BlogPagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBlogs(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ blogs: Blog[]; pagination: BlogPagination }>(`/blogs?page=${nextPage}&limit=10`);
      setBlogs(data.blogs);
      setPagination(data.pagination);
      setPage(data.pagination.page);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Blogs could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBlogs(1);
  }, []);

  const range = useMemo(() => {
    if (!pagination.total) return "0 posts";
    return `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`;
  }, [pagination]);

  return (
    <>
      <PageHeader
        title="Trader Blog"
        description="Market prep, funding guides, platform notes, and practical trading education."
        action={
          <Button type="button" variant="secondary" onClick={() => loadBlogs(page)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        }
      />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{error}</div> : null}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">No published blogs yet.</div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)}
        </section>
      )}

      {pagination.totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-500 dark:text-slate-400">Showing {range}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" disabled={page <= 1 || loading} onClick={() => loadBlogs(page - 1)}>Previous</Button>
            <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold dark:bg-white/10">{page} / {pagination.totalPages}</span>
            <Button type="button" variant="secondary" disabled={page >= pagination.totalPages || loading} onClick={() => loadBlogs(page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

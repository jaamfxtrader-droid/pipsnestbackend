"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3, Columns3, ExternalLink, Eye, Grid2X2, Heart, LayoutList, Loader2, MessageCircle, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import { CanvasVideoPlayer } from "@/components/blog/canvas-video-player";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Blog, BlogPagination } from "@/lib/blog-types";
import { cn } from "@/lib/utils";

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

type BlogView = "featured" | "grid" | "list" | "compact";

function shuffleBlogs(items: Blog[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function BlogSkeleton({ view }: { view: BlogView }) {
  const compact = view === "compact";
  const list = view === "list";
  return (
    <div
      className={cn(
        "animate-pulse overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
        compact && "grid min-h-[7rem] grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)]",
        list && "sm:grid sm:grid-cols-[260px_minmax(0,1fr)]"
      )}
    >
      <div className={cn("aspect-[16/10] bg-slate-200 dark:bg-white/10", compact && "aspect-auto h-full", list && "sm:aspect-auto sm:min-h-full")} />
      <div className={cn("grid gap-3 p-5", compact && "gap-2 p-3")}>
        <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-white/10" />
        {!compact ? <div className="h-16 rounded bg-slate-200 dark:bg-white/10" /> : null}
        <div className="flex gap-2">
          <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-7 w-14 rounded-full bg-slate-200 dark:bg-white/10" />
          <div className="h-7 w-14 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function BlogCard({ blog, featured = false, latest = false, view = "grid", lastViewed }: { blog: Blog; featured?: boolean; latest?: boolean; view?: BlogView; lastViewed?: string }) {
  const images = blog.images.slice(0, 6);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0];
  const video = blog.videos[0];
  const listMode = view === "list";
  const compactMode = view === "compact";

  return (
    <article className={cn(
      "group min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]",
      featured && "lg:grid lg:grid-cols-[1.2fr_0.8fr]",
      listMode && "sm:grid sm:grid-cols-[260px_minmax(0,1fr)]",
      compactMode && "grid min-h-[7rem] grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)]"
    )}>
      <div className={cn("relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-white/10", featured && "lg:aspect-auto lg:min-h-[28rem]", listMode && "sm:aspect-auto sm:min-h-full", compactMode && "aspect-auto h-full min-h-[7rem] w-full")}>
        {video?.videoUrl ? (
          <CanvasVideoPlayer src={video.videoUrl} title={video.title ?? blog.title} posterSrc={image?.imageUrl} preview className="h-full w-full rounded-none" />
        ) : image ? (
          <img src={image.imageUrl} alt={image.altText ?? blog.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">No image</div>
        )}
        {images.length > 1 && !compactMode ? (
          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-950 shadow" onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)} aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-950 shadow" onClick={() => setIndex((current) => (current + 1) % images.length)} aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        {images.length > 1 && !compactMode ? <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-2 py-1 text-xs font-bold text-white">{index + 1}/{images.length}</span> : null}
        {latest && !compactMode ? <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase text-white"><Sparkles className="h-3.5 w-3.5" /> New</span> : null}
      </div>
      <div className={cn("grid min-w-0 content-center gap-4 p-5", featured && "sm:p-8", compactMode && "gap-2 p-3")}>
        <div className="min-w-0">
          <div className={cn("flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400", compactMode && "gap-x-2 gap-y-1")}>
            {blog.category ? <span className="min-w-0 truncate font-black uppercase text-primary">{blog.category}</span> : null}
            {!compactMode && blog.authorName ? <span>{blog.authorName}</span> : null}
            {blog.publishedAt && !compactMode ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatDate(blog.publishedAt)}</span> : null}
          </div>
          <Link href={`/blogs/${blog.slug}`} className="block transition hover:text-primary">
            <h2 className={cn("mt-2 min-w-0 break-words font-black leading-tight", featured ? "line-clamp-2 text-3xl sm:text-4xl" : compactMode ? "line-clamp-2 text-sm sm:text-base" : "line-clamp-2 text-xl leading-7")}>{blog.title}</h2>
          </Link>
          {!compactMode ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{blog.shortDescription || blog.description}</p> : null}
          <div className={cn("mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400", compactMode && "mt-2 gap-1.5")}>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><Eye className="h-3.5 w-3.5" /> {blog.viewCount}{compactMode ? "" : " views"}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><Heart className="h-3.5 w-3.5" /> {blog.stats?.likes ?? 0}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><MessageCircle className="h-3.5 w-3.5" /> {blog.stats?.comments ?? 0}</span>
            {lastViewed ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">Viewed {lastViewed}</span> : null}
          </div>
        </div>
        {!compactMode ? <div className="grid gap-2 sm:grid-cols-2">
          {blog.referenceCtaUrl ? (
            <Link href={blog.referenceCtaUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white">
              <ExternalLink className="h-4 w-4" />
              {blog.referenceCtaText || "Reference"}
            </Link>
          ) : null}
          <Link href={`/blogs/${blog.slug}`} className={cn("inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500", !blog.referenceCtaUrl && "sm:col-span-2")}>
            Open Blog
          </Link>
        </div> : null}
      </div>
    </article>
  );
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [pagination, setPagination] = useState<BlogPagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [view, setView] = useState<BlogView>("featured");
  const [category, setCategory] = useState("All");
  const [viewedMap, setViewedMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBlogs(nextPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ blogs: Blog[]; pagination: BlogPagination }>(`/blogs?page=${nextPage}&limit=10`);
      setBlogs(shuffleBlogs(data.blogs));
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
    try {
      setViewedMap(JSON.parse(window.localStorage.getItem("pipnest_blog_views") ?? "{}"));
    } catch {
      setViewedMap({});
    }
  }, []);

  const range = useMemo(() => {
    if (!pagination.total) return "0 posts";
    return `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`;
  }, [pagination]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(blogs.map((blog) => blog.category).filter(Boolean) as string[]))], [blogs]);
  const visibleBlogs = useMemo(() => (category === "All" ? blogs : blogs.filter((blog) => blog.category === category)), [blogs, category]);
  const viewOptions = [
    { id: "featured", label: "Featured", icon: Newspaper },
    { id: "grid", label: "Grid", icon: Grid2X2 },
    { id: "list", label: "List", icon: LayoutList },
    { id: "compact", label: "Compact", icon: Columns3 }
  ] as const;
  function viewedLabel(slug: string) {
    const value = viewedMap[slug];
    if (!value) return undefined;
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
  }

  return (
    <main className="bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-normal sm:text-5xl">Learn From PipNest Markets</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Latest market notes, funding guides, and platform education from the PipNest desk.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={() => loadBlogs(page)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {viewOptions.map((item) => {
            const Icon = item.icon;
            return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition",
                view === item.id
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
            </button>
            );
          })}
        </div>
        {categories.length > 1 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-3 text-xs font-black uppercase transition",
                  category === item
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{error}</div> : null}

          <div className="mt-8">
            {loading ? (
              <section className={cn("grid gap-5", view === "grid" && "md:grid-cols-2 xl:grid-cols-3", view === "compact" && "gap-3")}>
                {Array.from({ length: view === "featured" ? 4 : 6 }).map((_, index) => <BlogSkeleton key={index} view={view === "featured" && index > 0 ? "grid" : view} />)}
              </section>
            ) : visibleBlogs.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">No published blogs yet.</div>
            ) : (
              <section className={cn("grid gap-5", view === "grid" && "md:grid-cols-2 xl:grid-cols-3", view === "compact" && "gap-3")}>
                {view === "featured" ? (
                  <>
                    <BlogCard blog={visibleBlogs[0]} featured latest view={view} lastViewed={viewedLabel(visibleBlogs[0].slug)} />
                    {visibleBlogs.length > 1 ? (
                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {visibleBlogs.slice(1).map((blog, index) => <BlogCard key={blog.id} blog={blog} latest={index < 2} view="grid" lastViewed={viewedLabel(blog.slug)} />)}
                      </div>
                    ) : null}
                  </>
                ) : (
                  visibleBlogs.map((blog, index) => <BlogCard key={blog.id} blog={blog} latest={index < 3} view={view} lastViewed={viewedLabel(blog.slug)} />)
                )}
              </section>
            )}
          </div>

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
      </section>
    </main>
  );
}

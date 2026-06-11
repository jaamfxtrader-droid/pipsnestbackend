"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Edit3, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { Blog } from "@/lib/blog-types";
import { useAuthStore } from "@/store/auth-store";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminBlogsPage() {
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const hydrate = useAuthStore((state) => state.hydrate);
  const pushToast = useToast((state) => state.push);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadBlogs(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ blogs: Blog[] }>("/admin/blogs", { token: authToken });
      setBlogs(data.blogs);
    } catch (error) {
      pushToast({ title: "Blogs not loaded", message: error instanceof Error ? error.message : "Please refresh and try again.", tone: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope === "admin" && token) void loadBlogs(token);
  }, [scope, token]);

  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter((blog) => blog.status === "PUBLISHED").length,
    drafts: blogs.filter((blog) => blog.status === "DRAFT").length,
    comments: blogs.reduce((sum, blog) => sum + (blog.stats?.comments ?? 0), 0)
  }), [blogs]);

  async function toggleStatus(blog: Blog) {
    if (!token) return;
    const nextStatus = blog.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const data = await apiFetch<{ blog: Blog }>(`/admin/blogs/${blog.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: nextStatus })
      });
      setBlogs((current) => current.map((item) => (item.id === blog.id ? { ...item, status: data.blog.status } : item)));
      pushToast({ title: "Status updated", message: `${blog.title} is now ${nextStatus.toLowerCase()}.`, tone: "success" });
    } catch (error) {
      pushToast({ title: "Status not updated", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
    }
  }

  async function deleteBlog() {
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch<{ message: string }>(`/admin/blogs/${deleteTarget.id}`, { method: "DELETE", token });
      setBlogs((current) => current.filter((blog) => blog.id !== deleteTarget.id));
      pushToast({ title: "Blog deleted", message: `${deleteTarget.title} was removed.`, tone: "success" });
      setDeleteTarget(null);
    } catch (error) {
      pushToast({ title: "Blog not deleted", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Blog CMS"
        description="Manage daily blog posts, SEO metadata, images, videos, CTAs, sections, and trader comments."
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => loadBlogs()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Link href="/admin/blogs/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
              <Plus className="h-4 w-4" />
              New Blog
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total posts", stats.total],
          ["Published", stats.published],
          ["Drafts", stats.drafts],
          ["Comments", stats.comments]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-black">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/[0.04] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Post</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Media</th>
                <th className="px-4 py-3 font-semibold">Stats</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading blogs...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No blog posts yet.</td></tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <img src={blog.images[0]?.imageUrl || "/og-image.svg"} alt="" className="h-14 w-20 rounded-md object-cover" />
                        <span className="min-w-0">
                          <span className="block max-w-xs break-words font-semibold">{blog.title}</span>
                          <span className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500 dark:text-slate-400">{blog.shortDescription}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">/blogs/{blog.slug}</td>
                    <td className="px-4 py-4">{blog.images.length} images, {blog.videos.length} videos</td>
                    <td className="px-4 py-4">
                      <div className="grid gap-1 text-xs text-slate-500">
                        <span>{blog.viewCount} views</span>
                        <span>{blog.stats?.likes ?? 0} likes</span>
                        <span>{blog.stats?.comments ?? 0} comments</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => void toggleStatus(blog)}>
                        <Badge tone={blog.status === "PUBLISHED" ? "profit" : "warning"}>{blog.status}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(blog.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link href={`/admin/blogs/${blog.id}/edit`} className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </Link>
                        <Button type="button" variant="danger" className="h-9 px-3" onClick={() => setDeleteTarget(blog)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete blog post?"
        description={deleteTarget ? `${deleteTarget.title} and all related comments/media records will be deleted.` : ""}
        confirmLabel="Delete Blog"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteBlog}
      />
    </>
  );
}

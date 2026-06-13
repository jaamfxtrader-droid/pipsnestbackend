"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, ExternalLink, Eye, FileText, Heart, Home, ImagePlus, Loader2, LogIn, MessageCircle, Reply, Send, ThumbsDown, ThumbsUp, Trash2, UserPlus, X } from "lucide-react";
import { CanvasVideoPlayer } from "@/components/blog/canvas-video-player";
import { RichTextRenderer } from "@/components/blog/rich-text-renderer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch, apiWebSocketUrl } from "@/lib/api";
import type { Blog, BlogComment } from "@/lib/blog-types";
import { cn } from "@/lib/utils";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

function sectionId(index: number) {
  return `blog-section-${index + 1}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function sectionMedia(value?: string | null, images?: Array<{ imageUrl: string; order: number }>, placement?: "top" | "middle" | "bottom") {
  if (images?.length) return { images, placement: placement ?? "middle" };
  if (!value) return { images: [] as Array<{ imageUrl: string; order: number }>, placement: "middle" as const };
  try {
    const parsed = JSON.parse(value) as { placement?: "top" | "middle" | "bottom"; images?: Array<{ imageUrl: string; order?: number }> };
    return {
      images: (parsed.images ?? []).map((image, index) => ({ imageUrl: image.imageUrl, order: image.order ?? index })),
      placement: parsed.placement ?? "middle"
    };
  } catch {
    return { images: [{ imageUrl: value, order: 0 }], placement: "middle" as const };
  }
}

function SectionImageCarousel({ images }: { images: Array<{ imageUrl: string; order: number }> }) {
  const sorted = useMemo(() => images.filter((image) => image.imageUrl).sort((left, right) => left.order - right.order), [images]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || sorted.length <= 1) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % sorted.length), 3200);
    return () => window.clearInterval(timer);
  }, [paused, sorted.length]);

  if (!sorted.length) return null;
  return (
    <div
      className="relative mt-5 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[0.04]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      {sorted.map((image, index) => (
        <img
          key={`${image.imageUrl}-${index}`}
          src={image.imageUrl}
          alt=""
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-700", index === active ? "opacity-100" : "opacity-0")}
        />
      ))}
      {sorted.length > 1 ? (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {sorted.map((image, index) => (
            <button
              key={`${image.imageUrl}-dot-${index}`}
              type="button"
              aria-label={`Show image ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn("h-2.5 w-2.5 rounded-full bg-white/60 transition", index === active && "w-6 bg-white")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BlogDetailClient({ blog }: { blog: Blog }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token) ?? getStoredAuthToken("user");
  const pushToast = useToast((state) => state.push);
  const [activeSection, setActiveSection] = useState(sectionId(0));
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [nextBlogs, setNextBlogs] = useState<Blog[]>([]);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [commentImages, setCommentImages] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [posting, setPosting] = useState(false);
  const [blogStats, setBlogStats] = useState(blog.stats ?? { comments: 0, likes: 0, dislikes: 0 });
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    try {
      const views = JSON.parse(window.localStorage.getItem("pipnest_blog_views") ?? "{}") as Record<string, string>;
      views[blog.slug] = new Date().toISOString();
      window.localStorage.setItem("pipnest_blog_views", JSON.stringify(views));
    } catch {
      return;
    }
  }, [blog.slug]);

  useEffect(() => {
    void apiFetch<{ comments: BlogComment[] }>(`/blogs/${blog.slug}/comments`).then((data) => setComments(data.comments)).catch(() => undefined);
    void apiFetch<{ blogs: Blog[] }>(`/blogs/${blog.slug}/next`).then((data) => setNextBlogs(data.blogs)).catch(() => undefined);
  }, [blog.slug]);

  useEffect(() => {
    const socket = new WebSocket(apiWebSocketUrl("/blogs/comments/live", { slug: blog.slug }));
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "blog.comment") {
          setComments((current) => {
            const incoming = payload.comment as BlogComment;
            if (current.some((item) => item.id === incoming.id)) return current;
            if (!incoming.parentId) return [...current, incoming];
            return current.map((item) => item.id === incoming.parentId ? { ...item, replies: [...(item.replies ?? []), incoming] } : item);
          });
          setBlogStats((current) => ({ ...current, comments: current.comments + 1 }));
        }
      } catch {
        return;
      }
    };
    return () => socket.close();
  }, [blog.slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.35, 0.65] }
    );
    blog.sections.forEach((_, index) => {
      const node = document.getElementById(sectionId(index));
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [blog.sections]);

  const commentImageList = useMemo(() => commentImages.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean), [commentImages]);

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Image could not be read"));
      reader.readAsDataURL(file);
    });
  }

  async function attachCommentImages(files?: FileList | null) {
    if (!files?.length) return;
    setImageUploading(true);
    try {
      const dataUrls = await Promise.all(Array.from(files).slice(0, 4).map(fileToDataUrl));
      setCommentImages((current) => [current, ...dataUrls].filter(Boolean).join("\n"));
    } finally {
      setImageUploading(false);
    }
  }

  async function postComment(parentId?: string) {
    if (!token) {
      setAuthPrompt(true);
      return;
    }
    const content = parentId ? replyText[parentId] ?? "" : comment;
    setPosting(true);
    try {
      const data = await apiFetch<{ comment: BlogComment }>(`/blogs/${blog.slug}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ content, parentId, isAnonymous: anonymous, displayName, images: parentId ? [] : commentImageList })
      });
      setComments((current) => {
        if (current.some((item) => item.id === data.comment.id)) return current;
        if (data.comment.parentId) return current.map((item) => item.id === data.comment.parentId ? { ...item, replies: [...(item.replies ?? []), data.comment] } : item);
        return [...current, data.comment];
      });
      setBlogStats((current) => ({ ...current, comments: current.comments + 1 }));
      if (parentId) setReplyText((current) => ({ ...current, [parentId]: "" }));
      else {
        setComment("");
        setCommentImages("");
      }
      pushToast({ title: "Comment posted", message: "Your comment is live.", tone: "success" });
    } catch (error) {
      pushToast({ title: "Comment not posted", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
    } finally {
      setPosting(false);
    }
  }

  async function reactToBlog(type: "LIKE" | "DISLIKE") {
    if (!token) {
      setAuthPrompt(true);
      return;
    }
    const data = await apiFetch<{ stats: { likes: number; dislikes: number } }>(`/blogs/${blog.slug}/reaction`, {
      method: "POST",
      token,
      body: JSON.stringify({ type })
    });
    setBlogStats((current) => ({ ...current, ...data.stats }));
  }

  async function reactToComment(commentId: string, type: "LIKE" | "DISLIKE") {
    if (!token) {
      setAuthPrompt(true);
      return;
    }
    const data = await apiFetch<{ stats: { likes: number; dislikes: number } }>(`/blogs/comments/${commentId}/reaction`, {
      method: "POST",
      token,
      body: JSON.stringify({ type })
    });
    setComments((current) =>
      current.map((item) => {
        if (item.id === commentId) return { ...item, stats: data.stats };
        return { ...item, replies: (item.replies ?? []).map((reply) => (reply.id === commentId ? { ...reply, stats: data.stats } : reply)) };
      })
    );
  }

  function AnonymousAvatar({ seed }: { seed: string }) {
    return <img src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`} alt="" className="h-10 w-10 rounded-full bg-slate-200 object-cover dark:bg-white/10" />;
  }

  function CommentItem({ item, nested = false }: { item: BlogComment; nested?: boolean }) {
    const author = item.isAnonymous ? item.displayName || "Anonymous" : item.user.name;
    return (
      <div className={cn("rounded-lg bg-slate-50 p-4 dark:bg-white/10", nested && "ml-6 border-l-2 border-primary/30")}>
        <div className="flex items-center gap-3">
          {item.isAnonymous ? <AnonymousAvatar seed={item.id} /> : item.user.avatarUrl ? <img src={item.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-xs font-black text-white">{author.slice(0, 2).toUpperCase()}</span>}
          <div>
            <div className="font-semibold">{author}</div>
            <div className="text-xs text-slate-500">{formatDate(item.createdAt)}</div>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{item.content}</p>
        {item.images.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{item.images.map((image) => <img key={image.id} src={image.imageUrl} alt="" className="rounded-md object-cover" />)}</div> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="h-8 px-3" onClick={() => reactToComment(item.id, "LIKE")}><ThumbsUp className="h-3.5 w-3.5" /> {item.stats?.likes ?? 0}</Button>
          <Button type="button" variant="ghost" className="h-8 px-3" onClick={() => reactToComment(item.id, "DISLIKE")}><ThumbsDown className="h-3.5 w-3.5" /> {item.stats?.dislikes ?? 0}</Button>
        </div>
        {!nested ? (
          <div className="mt-3 grid gap-2">
            {!replyOpen[item.id] ? (
              <Button type="button" variant="secondary" className="w-fit" onClick={() => setReplyOpen((current) => ({ ...current, [item.id]: true }))}><Reply className="h-4 w-4" /> Reply</Button>
            ) : (
              <>
                <textarea value={replyText[item.id] ?? ""} onChange={(event) => setReplyText((current) => ({ ...current, [item.id]: event.target.value }))} className="min-h-16 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" placeholder="Reply..." />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="w-fit" onClick={() => postComment(item.id)} disabled={posting || !(replyText[item.id] ?? "").trim()}><Reply className="h-4 w-4" /> Reply</Button>
                  <Button type="button" variant="ghost" className="w-fit" onClick={() => setReplyOpen((current) => ({ ...current, [item.id]: false }))}>Cancel</Button>
                </div>
              </>
            )}
          </div>
        ) : null}
        {item.replies?.length ? <div className="mt-4 grid gap-3">{item.replies.map((reply) => <CommentItem key={reply.id} item={reply} nested />)}</div> : null}
      </div>
    );
  }

  function AuthPromptModal() {
    if (!authPrompt) return null;
    return (
      <div className="fixed inset-0 z-[130] grid min-h-screen place-items-center p-4">
        <button type="button" aria-label="Close login prompt" className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setAuthPrompt(false)} />
        <div role="dialog" aria-modal="true" className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-slate-900">
          <button type="button" aria-label="Close" onClick={() => setAuthPrompt(false)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h2 className="pr-10 text-xl font-black">Login required</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Create an account or login to like posts, dislike posts, comment, reply, and react to comments.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/auth/register" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
            <Link href="/auth/login" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </div>
          <button type="button" onClick={() => setAuthPrompt(false)} className="mt-3 h-10 w-full rounded-full text-sm font-semibold text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-[#f7fbff] text-slate-950 dark:bg-[#061126] dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <Link href="/" className="inline-flex items-center gap-1 transition hover:text-primary">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link href="/blogs" className="transition hover:text-primary">Blogs</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate text-slate-950 dark:text-white">{blog.title}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              {blog.images[0] ? (
                <figure>
                  <img src={blog.images[0].imageUrl} alt={blog.images[0].altText ?? blog.title} className="max-h-[32rem] w-full object-cover" />
                  {(blog.images[0].title || blog.images[0].caption) ? (
                    <figcaption className="px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {blog.images[0].title ? <span className="font-semibold text-slate-700 dark:text-slate-200">{blog.images[0].title}</span> : null}
                      {blog.images[0].caption ? <span className="block">{blog.images[0].caption}</span> : null}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
              <div className="p-5 sm:p-8">
                {blog.category ? <div className="text-xs font-black uppercase text-primary">{blog.category}</div> : null}
                <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{blog.title}</h1>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{blog.authorName || "PipNest Editorial"}</span>
                  {blog.publishedAt ? <span>{formatDate(blog.publishedAt)}</span> : null}
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {blog.viewCount} views</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {blogStats.likes}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {blogStats.comments}</span>
                </div>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{blog.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => reactToBlog("LIKE")}><ThumbsUp className="h-4 w-4" /> Like {blogStats.likes}</Button>
                  <Button type="button" variant="secondary" onClick={() => reactToBlog("DISLIKE")}><ThumbsDown className="h-4 w-4" /> Dislike {blogStats.dislikes}</Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{tag}</span>)}
                </div>
                <RichTextRenderer className="prose prose-slate mt-8 max-w-none text-slate-700 dark:prose-invert dark:text-slate-200" value={blog.content} />
              </div>
            </div>

            {blog.images.length > 1 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {blog.images.slice(1).map((image) => (
                  <figure key={image.id ?? image.imageUrl} className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-white/[0.03]">
                    <img src={image.imageUrl} alt={image.altText ?? ""} className="aspect-[16/10] w-full object-cover" />
                    {(image.title || image.caption) ? (
                      <figcaption className="p-3 text-sm text-slate-500 dark:text-slate-400">
                        {image.title ? <span className="font-semibold text-slate-700 dark:text-slate-200">{image.title}</span> : null}
                        {image.caption ? <span className="block">{image.caption}</span> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6">
              {blog.sections.map((section, index) => {
                const media = sectionMedia(section.imageUrl, section.images, section.imagePlacement);
                const carousel = <SectionImageCarousel images={media.images} />;
                return (
                <section key={section.id ?? index} id={sectionId(index)} className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <h2 className="text-2xl font-black">{section.heading}</h2>
                  {media.placement === "top" ? carousel : null}
                  <RichTextRenderer className="mt-4 text-slate-600 dark:text-slate-300" value={section.content} />
                  {media.placement === "middle" ? carousel : null}
                  {section.videos?.length ? (
                    <div className="mt-5 grid gap-4">
                      {section.videos.map((video) => (
                        <div key={video.id ?? video.videoUrl} className="grid gap-2">
                          {video.title ? <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{video.title}</h3> : null}
                          <CanvasVideoPlayer src={video.videoUrl} title={video.title ?? section.heading} posterSrc={section.imageUrl || blog.images[0]?.imageUrl} />
                          {video.caption ? <p className="text-sm text-slate-500 dark:text-slate-400">{video.caption}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {media.placement === "bottom" ? carousel : null}
                </section>
              );})}
            </div>

            {blog.videos.length ? (
              <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <h2 className="text-xl font-black">Videos</h2>
                <div className="mt-4 grid gap-3">
                  {blog.videos.map((video) => (
                    <div key={video.id ?? video.videoUrl} className="grid gap-2">
                      {video.title ? <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{video.title}</h3> : null}
                      <CanvasVideoPlayer src={video.videoUrl} title={video.title ?? blog.title} posterSrc={blog.images[0]?.imageUrl} />
                      {video.caption ? <p className="text-sm text-slate-500 dark:text-slate-400">{video.caption}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {blog.attachments.length ? (
              <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <h2 className="text-xl font-black">Attachments</h2>
                <div className="mt-4 grid gap-3">
                  {blog.attachments.map((attachment) => (
                    <Link key={attachment.id ?? attachment.fileUrl} href={attachment.fileUrl} target="_blank" className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm font-semibold dark:bg-white/10">
                      <span className="inline-flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0" /> <span className="truncate">{attachment.title || "Attachment"}</span></span>
                      <Download className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="text-xl font-black">Comments</h2>
              <div className="mt-4 grid gap-3">
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-28 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" placeholder={token ? "Write a comment..." : "Login to write a comment"} />
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
                  Comment anonymously
                </label>
                {anonymous ? <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" placeholder="Optional display name" /> : null}
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary"><ImagePlus className="h-5 w-5" /></span>
                      <div>
                        <p className="text-sm font-semibold">Comment images</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Upload up to 4 images. API stores them on Cloudinary.</p>
                      </div>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
                      Choose Images
                      <input type="file" accept="image/*" multiple onChange={(event) => void attachCommentImages(event.target.files)} className="hidden" />
                    </label>
                  </div>
                  {commentImageList.length ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {commentImageList.map((image, index) => (
                        <div key={`${image.slice(0, 18)}-${index}`} className="relative overflow-hidden rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-white/10">
                          <img src={image} alt="" className="aspect-[16/10] w-full object-cover" />
                          <div className="absolute right-2 top-2 flex gap-2">
                            <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/90 text-slate-950 shadow" title="Change image" aria-label="Change image">
                              <ImagePlus className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  const dataUrl = await fileToDataUrl(file);
                                  const next = [...commentImageList];
                                  next[index] = dataUrl;
                                  setCommentImages(next.join("\n"));
                                }}
                              />
                            </label>
                            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-red-600 shadow" title="Remove image" aria-label="Remove image" onClick={() => setCommentImages(commentImageList.filter((_, itemIndex) => itemIndex !== index).join("\n"))}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {imageUploading ? <p className="text-xs font-semibold text-slate-500">Preparing images for Cloudinary upload...</p> : null}
                <Button type="button" onClick={() => postComment()} disabled={posting || !comment.trim()}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Post Comment
                </Button>
              </div>
              <div className="mt-6 grid gap-4">
                {comments.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p> : null}
                {comments.map((item) => <CommentItem key={item.id} item={item} />)}
              </div>
            </section>

            {nextBlogs.length ? (
              <section className="mt-8">
                <h2 className="text-xl font-black">Next Blogs</h2>
                <div className="mt-4 grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 lg:grid-flow-row lg:grid-cols-6">
                  {nextBlogs.map((nextBlog) => (
                    <Link key={nextBlog.id} href={`/blogs/${nextBlog.slug}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                      <img src={nextBlog.images[0]?.imageUrl || "/og-image.svg"} alt="" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </article>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="font-black">Topics</h2>
              <nav className="mt-4 grid gap-2">
                {blog.sections.map((section, index) => {
                  const id = sectionId(index);
                  return (
                    <a key={id} href={`#${id}`} className={cn("flex items-center gap-3 rounded-md p-2 text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-white/10", activeSection === id && "bg-primary/10 text-primary")}>
                      {section.imageUrl ? <img src={section.imageUrl} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded bg-primary/10 text-sm font-black text-primary">{index + 1}</span>}
                      <span>{section.heading}</span>
                    </a>
                  );
                })}
              </nav>
              <div className="mt-5 grid gap-2">
                {blog.referenceCtaUrl ? (
                  <Link href={blog.referenceCtaUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <ExternalLink className="h-4 w-4" />
                    {blog.referenceCtaText || "Reference"}
                  </Link>
                ) : null}
                {user ? <span className="text-xs text-slate-500">Commenting as {user.name}</span> : <Link href="/auth/login" className="text-sm font-semibold text-primary">Login to comment</Link>}
              </div>
            </div>
          </aside>
        </div>
      </section>
      <AuthPromptModal />
    </main>
  );
}

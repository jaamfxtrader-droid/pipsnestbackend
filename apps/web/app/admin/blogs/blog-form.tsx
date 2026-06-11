"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { Blog, BlogStatus } from "@/lib/blog-types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type BlogFormProps = {
  blogId?: string;
};

type BlogEditorForm = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  keywords: string;
  status: BlogStatus;
  referenceCtaText: string;
  referenceCtaUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  authorName: string;
  publishedAt: string;
  images: Array<{ imageUrl: string; altText: string; order: number }>;
  videos: Array<{ videoUrl: string; title: string; order: number }>;
  attachments: Array<{ fileUrl: string; title: string; contentType: string; order: number }>;
  sections: Array<{ heading: string; content: string; imageUrl: string; videos: Array<{ videoUrl: string; title: string; order: number }>; order: number }>;
};

const emptyForm: BlogEditorForm = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  content: "",
  category: "",
  tags: "",
  keywords: "",
  status: "DRAFT" as const,
  referenceCtaText: "Read details",
  referenceCtaUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  authorName: "PipNest Editorial",
  publishedAt: "",
  images: [
    { imageUrl: "", altText: "", order: 0 },
    { imageUrl: "", altText: "", order: 1 }
  ],
  videos: [] as Array<{ videoUrl: string; title: string; order: number }>,
  attachments: [] as Array<{ fileUrl: string; title: string; contentType: string; order: number }>,
  sections: [{ heading: "", content: "", imageUrl: "", videos: [], order: 0 }]
};

function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCsv(value?: string[] | null) {
  return value?.join(", ") ?? "";
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.readAsDataURL(file);
  });
}

export function BlogForm({ blogId }: BlogFormProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const hydrate = useAuthStore((state) => state.hydrate);
  const pushToast = useToast((state) => state.push);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(blogId));
  const [saving, setSaving] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(blogId));

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  useEffect(() => {
    if (!blogId || scope !== "admin" || !token) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<{ blog: Blog }>(`/admin/blogs/${blogId}`, { token })
      .then(({ blog }) => {
        if (cancelled) return;
        setForm({
          title: blog.title,
          slug: blog.slug,
          shortDescription: blog.shortDescription,
          description: blog.description,
          content: blog.content,
          category: blog.category ?? "",
          tags: toCsv(blog.tags),
          keywords: toCsv(blog.keywords),
          status: blog.status,
          referenceCtaText: blog.referenceCtaText ?? "",
          referenceCtaUrl: blog.referenceCtaUrl ?? "",
          seoTitle: blog.seoTitle ?? "",
          seoDescription: blog.seoDescription ?? "",
          seoKeywords: toCsv(blog.seoKeywords),
          canonicalUrl: blog.canonicalUrl ?? "",
          authorName: blog.authorName ?? "PipNest Editorial",
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : "",
          images: blog.images.map((image, index) => ({ imageUrl: image.imageUrl, altText: image.altText ?? "", order: image.order ?? index })),
          videos: blog.videos.map((video, index) => ({ videoUrl: video.videoUrl, title: video.title ?? "", order: video.order ?? index })),
          attachments: blog.attachments.map((attachment, index) => ({ fileUrl: attachment.fileUrl, title: attachment.title ?? "", contentType: attachment.contentType ?? "", order: attachment.order ?? index })),
          sections: blog.sections.length
            ? blog.sections.map((section, index) => ({
                heading: section.heading,
                content: section.content,
                imageUrl: section.imageUrl ?? "",
                videos: (section.videos ?? []).map((video, videoIndex) => ({ videoUrl: video.videoUrl, title: video.title ?? "", order: video.order ?? videoIndex })),
                order: section.order ?? index
              }))
            : [{ heading: "", content: "", imageUrl: "", videos: [], order: 0 }]
        });
      })
      .catch((error) => {
        pushToast({ title: "Blog not loaded", message: error instanceof Error ? error.message : "Please try again.", tone: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blogId, scope, token, pushToast]);

  const validImages = useMemo(() => form.images.filter((image) => image.imageUrl.trim()), [form.images]);
  const canSave = form.title.trim() && form.slug.trim() && form.description.trim() && form.content.trim() && validImages.length >= 2 && validImages.length <= 5;

  function setTitle(title: string) {
    setForm((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugifyTitle(title) }));
  }

  function payload() {
    return {
      ...form,
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "",
      images: form.images.filter((image) => image.imageUrl.trim()).map((image, index) => ({ ...image, order: index })),
      videos: form.videos.filter((video) => video.videoUrl.trim()).map((video, index) => ({ ...video, order: index })),
      attachments: form.attachments.filter((attachment) => attachment.fileUrl.trim()).map((attachment, index) => ({ ...attachment, order: index })),
      sections: form.sections.filter((section) => section.heading.trim() || section.content.trim()).map((section, index) => ({ ...section, order: index }))
    };
  }

  async function saveBlog() {
    if (!token || !canSave) return;
    setSaving(true);
    try {
      const { blog } = await apiFetch<{ blog: Blog }>(blogId ? `/admin/blogs/${blogId}` : "/admin/blogs", {
        method: blogId ? "PUT" : "POST",
        token,
        body: JSON.stringify(payload())
      });
      pushToast({ title: "Blog saved", message: `${blog.title} is ${blog.status === "PUBLISHED" ? "published" : "saved as draft"}.`, tone: "success" });
      router.push("/admin/blogs");
    } catch (error) {
      pushToast({ title: "Blog not saved", message: error instanceof Error ? error.message : "Check required fields and image limits.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function attachImage(index: number, file?: File) {
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) => (imageIndex === index ? { ...image, imageUrl } : image))
    }));
  }

  async function attachVideo(index: number, file?: File) {
    if (!file) return;
    const videoUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      videos: current.videos.map((video, videoIndex) => (videoIndex === index ? { ...video, videoUrl, title: video.title || file.name } : video))
    }));
  }

  async function attachSectionVideo(sectionIndex: number, videoIndex: number, file?: File) {
    if (!file) return;
    const videoUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              videos: section.videos.map((video, currentVideoIndex) =>
                currentVideoIndex === videoIndex ? { ...video, videoUrl, title: video.title || file.name } : video
              )
            }
          : section
      )
    }));
  }

  async function attachDocument(index: number, file?: File) {
    if (!file) return;
    const fileUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      attachments: current.attachments.map((attachment, attachmentIndex) =>
        attachmentIndex === index ? { ...attachment, fileUrl, title: attachment.title || file.name, contentType: file.type } : attachment
      )
    }));
  }

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03]">Loading blog editor...</div>;
  }

  return (
    <>
      <PageHeader
        title={blogId ? "Edit Blog Post" : "Create Blog Post"}
        description="Create image-rich trading education posts with SEO fields, CTA links, sections, videos, and comment support."
        action={
          <Button type="button" onClick={saveBlog} disabled={saving || !canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Blog
          </Button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Title
                <Input value={form.title} onChange={(event) => setTitle(event.target.value)} placeholder="Daily market prep for funded traders" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Slug
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setForm((current) => ({ ...current, slug: slugifyTitle(event.target.value) }));
                  }}
                  placeholder="daily-market-prep-funded-traders"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Author
                  <Input value={form.authorName} onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))} placeholder="PipNest Editorial" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Published time
                  <Input type="datetime-local" value={form.publishedAt} onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Short description
                <textarea className="min-h-24 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" value={form.shortDescription} onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Description
                <textarea className="min-h-28 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Full formatted content
                <textarea className="min-h-56 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Images</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Minimum 2, maximum 5.</p>
              </div>
              <Button type="button" variant="secondary" disabled={form.images.length >= 5} onClick={() => setForm((current) => ({ ...current, images: [...current.images, { imageUrl: "", altText: "", order: current.images.length }] }))}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {form.images.map((image, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <div className="aspect-[16/9] overflow-hidden rounded-md bg-slate-100 dark:bg-white/10">
                    {image.imageUrl ? <img src={image.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><ImagePlus className="h-8 w-8" /></div>}
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Input value={image.imageUrl} onChange={(event) => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: event.target.value } : item)) }))} placeholder="Image URL or base64" />
                    <Input value={image.altText} onChange={(event) => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, altText: event.target.value } : item)) }))} placeholder="Alt text" />
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
                      <ImagePlus className="h-4 w-4" />
                      {image.imageUrl ? "Change Image" : "Upload Image"}
                      <input type="file" accept="image/*" onChange={(event) => void attachImage(index, event.target.files?.[0])} className="hidden" />
                    </label>
                    {image.imageUrl ? (
                      <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: "" } : item)) }))}>
                        Deselect
                      </Button>
                    ) : null}
                    <Button type="button" variant="danger" disabled={form.images.length <= 2} onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }))}>
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Sections / Sidebar Headings</h2>
              <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, sections: [...current.sections, { heading: "", content: "", imageUrl: "", videos: [], order: current.sections.length }] }))}>
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>
            <div className="mt-4 grid gap-4">
              {form.sections.map((section, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                  <Input value={section.heading} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, heading: event.target.value } : item)) }))} placeholder="Heading or question" />
                  <textarea className="min-h-28 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" value={section.content} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, content: event.target.value } : item)) }))} placeholder="Section content" />
                  <Input value={section.imageUrl} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: event.target.value } : item)) }))} placeholder="Optional section image URL" />
                  <div className="rounded-md bg-slate-50 p-3 dark:bg-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Section videos</p>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={section.videos.length >= 2}
                        onClick={() => setForm((current) => ({
                          ...current,
                          sections: current.sections.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, videos: [...item.videos, { videoUrl: "", title: "", order: item.videos.length }] } : item
                          )
                        }))}
                      >
                        <Plus className="h-4 w-4" />
                        Add Video
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {section.videos.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">No section videos.</p> : null}
                      {section.videos.map((video, videoIndex) => (
                        <div key={videoIndex} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/30">
                          <Input value={video.title} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.map((currentVideo, currentVideoIndex) => currentVideoIndex === videoIndex ? { ...currentVideo, title: event.target.value } : currentVideo) } : item) }))} placeholder="Video title" />
                          <Input value={video.videoUrl} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.map((currentVideo, currentVideoIndex) => currentVideoIndex === videoIndex ? { ...currentVideo, videoUrl: event.target.value } : currentVideo) } : item) }))} placeholder="Video URL or uploaded file" />
                          <input type="file" accept="video/*" onChange={(event) => void attachSectionVideo(index, videoIndex, event.target.files?.[0])} className="text-xs" />
                          <Button type="button" variant="danger" onClick={() => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.filter((_, currentVideoIndex) => currentVideoIndex !== videoIndex) } : item) }))}>Remove Video</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button type="button" variant="danger" disabled={form.sections.length <= 1} onClick={() => setForm((current) => ({ ...current, sections: current.sections.filter((_, itemIndex) => itemIndex !== index) }))}>
                    <Trash2 className="h-4 w-4" />
                    Remove Section
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid gap-5 xl:sticky xl:top-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <SwitchField checked={form.status === "PUBLISHED"} onChange={(checked) => setForm((current) => ({ ...current, status: checked ? "PUBLISHED" : "DRAFT" }))} label="Published" description={form.status === "PUBLISHED" ? "Visible on blog pages" : "Saved as draft"} />
            <div className={cn("mt-4 rounded-md p-3 text-sm font-semibold", validImages.length >= 2 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
              {validImages.length}/5 images added
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="font-semibold">Category & CTA</h2>
            <div className="mt-4 grid gap-3">
              <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Market Analysis" />
              <Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags, comma separated" />
              <Input value={form.keywords} onChange={(event) => setForm((current) => ({ ...current, keywords: event.target.value }))} placeholder="Keywords, comma separated" />
              <Input value={form.referenceCtaText} onChange={(event) => setForm((current) => ({ ...current, referenceCtaText: event.target.value }))} placeholder="Reference CTA text" />
              <Input value={form.referenceCtaUrl} onChange={(event) => setForm((current) => ({ ...current, referenceCtaUrl: event.target.value }))} placeholder="https://example.com/reference" />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Videos</h2>
              <Button type="button" variant="secondary" disabled={form.videos.length >= 2} onClick={() => setForm((current) => ({ ...current, videos: [...current.videos, { videoUrl: "", title: "", order: current.videos.length }] }))}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {form.videos.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No videos added.</p> : null}
              {form.videos.map((video, index) => (
                <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-white/10">
                  <Input value={video.videoUrl} onChange={(event) => setForm((current) => ({ ...current, videos: current.videos.map((item, itemIndex) => (itemIndex === index ? { ...item, videoUrl: event.target.value } : item)) }))} placeholder="Video URL" />
                  <Input value={video.title} onChange={(event) => setForm((current) => ({ ...current, videos: current.videos.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)) }))} placeholder="Video title" />
                  <input type="file" accept="video/*" onChange={(event) => void attachVideo(index, event.target.files?.[0])} className="text-xs" />
                  <Button type="button" variant="danger" onClick={() => setForm((current) => ({ ...current, videos: current.videos.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Attachments</h2>
              <Button type="button" variant="secondary" disabled={form.attachments.length >= 5} onClick={() => setForm((current) => ({ ...current, attachments: [...current.attachments, { fileUrl: "", title: "", contentType: "", order: current.attachments.length }] }))}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {form.attachments.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No documents attached.</p> : null}
              {form.attachments.map((attachment, index) => (
                <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-white/10">
                  <Input value={attachment.title} onChange={(event) => setForm((current) => ({ ...current, attachments: current.attachments.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value } : item)) }))} placeholder="Attachment title" />
                  <Input value={attachment.fileUrl} onChange={(event) => setForm((current) => ({ ...current, attachments: current.attachments.map((item, itemIndex) => (itemIndex === index ? { ...item, fileUrl: event.target.value } : item)) }))} placeholder="File URL or uploaded file" />
                  <input type="file" onChange={(event) => void attachDocument(index, event.target.files?.[0])} className="text-xs" />
                  <Button type="button" variant="danger" onClick={() => setForm((current) => ({ ...current, attachments: current.attachments.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="font-semibold">SEO</h2>
            <div className="mt-4 grid gap-3">
              <Input value={form.seoTitle} onChange={(event) => setForm((current) => ({ ...current, seoTitle: event.target.value }))} placeholder="SEO title" />
              <textarea className="min-h-24 resize-none rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10" value={form.seoDescription} onChange={(event) => setForm((current) => ({ ...current, seoDescription: event.target.value }))} placeholder="SEO description" />
              <Input value={form.seoKeywords} onChange={(event) => setForm((current) => ({ ...current, seoKeywords: event.target.value }))} placeholder="SEO keywords" />
              <Input value={form.canonicalUrl} onChange={(event) => setForm((current) => ({ ...current, canonicalUrl: event.target.value }))} placeholder="Canonical URL" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

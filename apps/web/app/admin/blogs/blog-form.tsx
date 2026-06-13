"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileVideo, ImagePlus, Loader2, Plus, Save, Trash2, UploadCloud, X } from "lucide-react";
import { RichTextEditor } from "@/components/blog/rich-text-editor";
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
  images: Array<{ imageUrl: string; title: string; caption: string; altText: string; order: number }>;
  videos: Array<{ videoUrl: string; title: string; caption: string; order: number }>;
  attachments: Array<{ fileUrl: string; title: string; contentType: string; order: number }>;
  sections: Array<{ heading: string; content: string; images: Array<{ imageUrl: string; order: number }>; imagePlacement: "top" | "middle" | "bottom"; videos: Array<{ videoUrl: string; title: string; caption: string; order: number }>; order: number }>;
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
    { imageUrl: "", title: "", caption: "", altText: "", order: 0 },
    { imageUrl: "", title: "", caption: "", altText: "", order: 1 }
  ],
  videos: [] as Array<{ videoUrl: string; title: string; caption: string; order: number }>,
  attachments: [] as Array<{ fileUrl: string; title: string; contentType: string; order: number }>,
  sections: [{ heading: "", content: "", images: [], imagePlacement: "middle", videos: [], order: 0 }]
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

function limitText(value: string, max: number) {
  return value.trim().slice(0, max);
}

function optionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).toString();
  } catch {
    return "";
  }
}

function sectionMedia(value?: string | null) {
  if (!value) return { images: [] as Array<{ imageUrl: string; order: number }>, imagePlacement: "middle" as const };
  try {
    const parsed = JSON.parse(value) as { placement?: "top" | "middle" | "bottom"; images?: Array<{ imageUrl: string; order?: number }> };
    return {
      images: (parsed.images ?? []).slice(0, 3).map((image, index) => ({ imageUrl: image.imageUrl, order: image.order ?? index })),
      imagePlacement: parsed.placement ?? "middle"
    };
  } catch {
    return { images: [{ imageUrl: value, order: 0 }], imagePlacement: "middle" as const };
  }
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Image could not be read"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

type MediaPickerProps = {
  kind: "image" | "video";
  value: string;
  title?: string;
  caption?: string;
  altText?: string;
  compact?: boolean;
  onFile(file?: File): void;
  onClear(): void;
  onTitle?(value: string): void;
  onCaption?(value: string): void;
  onAltText?(value: string): void;
};

function MediaPicker({ kind, value, title, caption, altText, compact, onFile, onClear, onTitle, onCaption, onAltText }: MediaPickerProps) {
  const [fileMeta, setFileMeta] = useState("");
  const accept = kind === "image" ? "image/*" : "video/*";
  const Icon = kind === "image" ? ImagePlus : FileVideo;
  const label = value ? `Change ${kind}` : `Upload ${kind}`;

  return (
    <div className="grid gap-3">
      <div className={cn("overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-white/15 dark:bg-white/[0.04]", compact ? "aspect-[16/9]" : "aspect-[16/10]")}>
        {value ? (
          kind === "image" ? (
            <img src={value} alt={altText || title || ""} className="h-full w-full object-cover" />
          ) : (
            <video src={value} className="h-full w-full object-cover" controls preload="metadata" />
          )
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-slate-500 dark:text-slate-400">
            <span className="grid justify-items-center gap-2">
              <Icon className="h-8 w-8" />
              <span className="text-sm font-semibold">Select {kind}</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
          <UploadCloud className="h-4 w-4" />
          {label}
          <input
            type="file"
            accept={accept}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileMeta(file ? `${file.name} (${formatBytes(file.size)})` : "");
              onFile(file);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
        </label>
        {value ? (
          <Button type="button" variant="secondary" className="h-10 px-3" onClick={onClear}>
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {fileMeta ? <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{fileMeta}</p> : null}
      {onTitle ? <Input value={title ?? ""} onChange={(event) => onTitle(event.target.value)} placeholder={`${kind === "image" ? "Image" : "Video"} title`} /> : null}
      {onCaption ? <Input value={caption ?? ""} onChange={(event) => onCaption(event.target.value)} placeholder={`${kind === "image" ? "Image" : "Video"} caption`} /> : null}
      {onAltText ? <Input value={altText ?? ""} onChange={(event) => onAltText(event.target.value)} placeholder="Alt text" /> : null}
    </div>
  );
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
          images: blog.images.map((image, index) => ({ imageUrl: image.imageUrl, title: image.title ?? "", caption: image.caption ?? "", altText: image.altText ?? "", order: image.order ?? index })),
          videos: blog.videos.map((video, index) => ({ videoUrl: video.videoUrl, title: video.title ?? "", caption: video.caption ?? "", order: video.order ?? index })),
          attachments: blog.attachments.map((attachment, index) => ({ fileUrl: attachment.fileUrl, title: attachment.title ?? "", contentType: attachment.contentType ?? "", order: attachment.order ?? index })),
          sections: blog.sections.length
            ? blog.sections.map((section, index) => {
                const media = sectionMedia(section.imageUrl);
                return {
                  heading: section.heading,
                  content: section.content,
                  images: section.images?.length ? section.images.map((image, imageIndex) => ({ imageUrl: image.imageUrl, order: image.order ?? imageIndex })) : media.images,
                  imagePlacement: section.imagePlacement ?? media.imagePlacement,
                  videos: (section.videos ?? []).map((video, videoIndex) => ({ videoUrl: video.videoUrl, title: video.title ?? "", caption: video.caption ?? "", order: video.order ?? videoIndex })),
                  order: section.order ?? index
                };
              })
            : [{ heading: "", content: "", images: [], imagePlacement: "middle", videos: [], order: 0 }]
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
  const canSave =
    form.title.trim().length >= 2 &&
    form.slug.trim().length >= 2 &&
    form.shortDescription.trim().length >= 10 &&
    form.description.trim().length >= 10 &&
    form.content.trim().length >= 10 &&
    validImages.length >= 2 &&
    validImages.length <= 5;

  function setTitle(title: string) {
    setForm((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugifyTitle(title) }));
  }

  function payload() {
    return {
      ...form,
      title: limitText(form.title, 180),
      shortDescription: limitText(form.shortDescription, 300),
      category: limitText(form.category, 80),
      referenceCtaText: limitText(form.referenceCtaText, 80),
      referenceCtaUrl: optionalUrl(form.referenceCtaUrl),
      seoTitle: limitText(form.seoTitle, 180),
      seoDescription: limitText(form.seoDescription, 300),
      canonicalUrl: optionalUrl(form.canonicalUrl),
      authorName: limitText(form.authorName, 100),
      publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "",
      images: form.images.filter((image) => image.imageUrl.trim()).map((image, index) => ({
        imageUrl: image.imageUrl,
        title: limitText(image.title, 120),
        caption: limitText(image.caption, 240),
        altText: limitText(image.altText, 160),
        order: index
      })),
      videos: form.videos.filter((video) => video.videoUrl.trim()).map((video, index) => ({
        videoUrl: video.videoUrl,
        title: limitText(video.title, 120),
        caption: limitText(video.caption, 240),
        order: index
      })),
      attachments: form.attachments.filter((attachment) => attachment.fileUrl.trim()).map((attachment, index) => ({
        fileUrl: attachment.fileUrl,
        title: limitText(attachment.title, 140),
        contentType: limitText(attachment.contentType, 80),
        order: index
      })),
      sections: form.sections
        .filter((section) => section.heading.trim().length >= 2 && section.content.trim().length >= 1)
        .map((section, index) => ({
          heading: limitText(section.heading, 180),
          content: section.content.trim(),
          imageUrl: section.images[0]?.imageUrl ?? "",
          images: section.images.filter((image) => image.imageUrl.trim()).slice(0, 3).map((image, imageIndex) => ({ imageUrl: image.imageUrl, order: imageIndex })),
          imagePlacement: section.imagePlacement,
          videos: section.videos.filter((video) => video.videoUrl.trim()).map((video, videoIndex) => ({
            videoUrl: video.videoUrl,
            title: limitText(video.title, 120),
            caption: limitText(video.caption, 240),
            order: videoIndex
          })),
          order: index
        }))
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
      images: current.images.map((image, imageIndex) => (imageIndex === index ? { ...image, imageUrl, title: image.title || file.name.replace(/\.[^.]+$/, "") } : image))
    }));
  }

  async function attachVideo(index: number, file?: File) {
    if (!file) return;
    const videoUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      videos: current.videos.map((video, videoIndex) => (videoIndex === index ? { ...video, videoUrl, title: video.title || file.name.replace(/\.[^.]+$/, "") } : video))
    }));
  }

  async function attachSectionImage(index: number, imageIndex: number, file?: File) {
    if (!file) return;
    const imageUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              images: [0, 1, 2]
                .map((slot) => (slot === imageIndex ? { imageUrl, order: slot } : section.images[slot]))
                .filter((image): image is { imageUrl: string; order: number } => Boolean(image?.imageUrl))
                .map((image, nextIndex) => ({ ...image, order: nextIndex }))
            }
          : section
      )
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
                currentVideoIndex === videoIndex ? { ...video, videoUrl, title: video.title || file.name.replace(/\.[^.]+$/, "") } : video
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
                <RichTextEditor
                  value={form.content}
                  onChange={(content) => setForm((current) => ({ ...current, content }))}
                  minHeight="min-h-64"
                  placeholder="Write content. Use toolbar for lists, links, bold, underline, strike, italic, and capitalization."
                />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Images</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Minimum 2, maximum 5.</p>
              </div>
              <Button type="button" variant="secondary" disabled={form.images.length >= 5} onClick={() => setForm((current) => ({ ...current, images: [...current.images, { imageUrl: "", title: "", caption: "", altText: "", order: current.images.length }] }))}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {form.images.map((image, index) => (
                <div key={index} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <MediaPicker
                    kind="image"
                    value={image.imageUrl}
                    title={image.title}
                    caption={image.caption}
                    altText={image.altText}
                    onFile={(file) => void attachImage(index, file)}
                    onClear={() => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: "" } : item)) }))}
                    onTitle={(value) => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, title: value } : item)) }))}
                    onCaption={(value) => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, caption: value } : item)) }))}
                    onAltText={(value) => setForm((current) => ({ ...current, images: current.images.map((item, itemIndex) => (itemIndex === index ? { ...item, altText: value } : item)) }))}
                  />
                  <div className="mt-3 grid gap-2">
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
              <Button type="button" variant="secondary" onClick={() => setForm((current) => ({ ...current, sections: [...current.sections, { heading: "", content: "", images: [], imagePlacement: "middle", videos: [], order: current.sections.length }] }))}>
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>
            <div className="mt-4 grid gap-4">
              {form.sections.map((section, index) => (
                <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
                  <Input value={section.heading} onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, heading: event.target.value } : item)) }))} placeholder="Heading or question" />
                  <RichTextEditor
                    value={section.content}
                    onChange={(content) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => (itemIndex === index ? { ...item, content } : item)) }))}
                    minHeight="min-h-36"
                    placeholder="Section content"
                  />
                  <div className="grid gap-3 rounded-md bg-slate-50 p-3 dark:bg-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Section images</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Up to 3 images. Same placement becomes a fading carousel.</p>
                      </div>
                      <select
                        value={section.imagePlacement}
                        onChange={(event) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, imagePlacement: event.target.value as "top" | "middle" | "bottom" } : item) }))}
                        className="h-10 rounded-md border border-slate-300/30 bg-white px-3 text-sm font-semibold outline-none focus:border-primary dark:bg-slate-950/40"
                      >
                        <option value="top">Top</option>
                        <option value="middle">Middle</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[0, 1, 2].map((imageIndex) => {
                        const image = section.images[imageIndex];
                        return (
                          <div key={imageIndex} className="grid gap-2 rounded-md border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-950/30">
                            <MediaPicker
                              kind="image"
                              value={image?.imageUrl ?? ""}
                              compact
                              onFile={(file) => void attachSectionImage(index, imageIndex, file)}
                              onClear={() => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, images: item.images.filter((_, currentImageIndex) => currentImageIndex !== imageIndex).map((currentImage, nextIndex) => ({ ...currentImage, order: nextIndex })) } : item) }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                            itemIndex === index ? { ...item, videos: [...item.videos, { videoUrl: "", title: "", caption: "", order: item.videos.length }] } : item
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
                          <MediaPicker
                            kind="video"
                            value={video.videoUrl}
                            title={video.title}
                            caption={video.caption}
                            compact
                            onFile={(file) => void attachSectionVideo(index, videoIndex, file)}
                            onClear={() => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.map((currentVideo, currentVideoIndex) => currentVideoIndex === videoIndex ? { ...currentVideo, videoUrl: "" } : currentVideo) } : item) }))}
                            onTitle={(value) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.map((currentVideo, currentVideoIndex) => currentVideoIndex === videoIndex ? { ...currentVideo, title: value } : currentVideo) } : item) }))}
                            onCaption={(value) => setForm((current) => ({ ...current, sections: current.sections.map((item, itemIndex) => itemIndex === index ? { ...item, videos: item.videos.map((currentVideo, currentVideoIndex) => currentVideoIndex === videoIndex ? { ...currentVideo, caption: value } : currentVideo) } : item) }))}
                          />
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
              <Button type="button" variant="secondary" disabled={form.videos.length >= 2} onClick={() => setForm((current) => ({ ...current, videos: [...current.videos, { videoUrl: "", title: "", caption: "", order: current.videos.length }] }))}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {form.videos.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No videos added.</p> : null}
              {form.videos.map((video, index) => (
                <div key={index} className="grid gap-2 rounded-md bg-slate-50 p-3 dark:bg-white/10">
                  <MediaPicker
                    kind="video"
                    value={video.videoUrl}
                    title={video.title}
                    caption={video.caption}
                    compact
                    onFile={(file) => void attachVideo(index, file)}
                    onClear={() => setForm((current) => ({ ...current, videos: current.videos.map((item, itemIndex) => (itemIndex === index ? { ...item, videoUrl: "" } : item)) }))}
                    onTitle={(value) => setForm((current) => ({ ...current, videos: current.videos.map((item, itemIndex) => (itemIndex === index ? { ...item, title: value } : item)) }))}
                    onCaption={(value) => setForm((current) => ({ ...current, videos: current.videos.map((item, itemIndex) => (itemIndex === index ? { ...item, caption: value } : item)) }))}
                  />
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

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Grid3x3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Plus,
  Save,
  Settings,
  Trash2,
  Type,
  ChevronUp,
  ChevronDown,
  Copy,
  AlertCircle,
  ExternalLink,
  FileVideo,
  Smartphone,
  Tablet,
  Monitor,
  Navigation,
  Upload,
  Badge as BadgeIcon,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getStoredAuthToken } from "@/store/auth-store";
import { cmsPageDrafts, mergeCmsPage, type CmsPage, type CmsSection } from "@/lib/cms";

type EditorTab = "content" | "seo" | "styling" | "preview";
type SectionType = "block" | "grid" | "flex" | "carousel" | "media" | "split";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type ThemeMode = "light" | "dark" | "both";

const fixedPageNames: Record<string, string> = {
  home: "Landing Page / Home Page",
  about: "About Page",
  contact: "Contact Page",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  disclaimer: "Disclaimers",
  "kyc-policy": "KYC Policy Page",
  "refund-policy": "Refund Policy",
  "risk-disclosure": "Risk Disclosure",
  affiliate: "Affiliate Rules Page",
  "layout-rules": "Layout Rules Page",
  "challenge-details": "Rules",
  "funding-programs": "Funding",
  faq: "FAQ"
};

const editableSlugs = Object.keys(fixedPageNames);

function pageDisplayName(page: CmsPage) {
  return fixedPageNames[page.slug] ?? page.metadata?.navLabel ?? page.title ?? page.slug;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AdvancedCmsEditor() {
  const pushToast = useToast((state) => state.push);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [draft, setDraft] = useState<CmsPage | null>(null);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [deleteSectionIndex, setDeleteSectionIndex] = useState<number | null>(null);
  const [newPageForm, setNewPageForm] = useState({
    title: "",
    slug: "",
    navLabel: "",
    navPlacement: "footer" as "header" | "footer" | "both" | "hidden"
  });
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeText, setBadgeText] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("");

  const token = getStoredAuthToken("admin");

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch<{ pages: CmsPage[] }>("/admin/cms", { token });
      const remoteBySlug = new Map(data.pages.filter((page) => page.slug !== "site-settings").map((page) => [page.slug, page]));
      const fixedPages = editableSlugs
        .map((slug) => {
          const fallback = cmsPageDrafts.find((page) => page.slug === slug) ?? {
            slug,
            title: fixedPageNames[slug],
            content: fixedPageNames[slug],
            published: true,
            sections: []
          };
          return mergeCmsPage(fallback, remoteBySlug.get(slug))!;
        })
        .map((page) => ({
          ...page,
          title: page.title || fixedPageNames[page.slug],
          metadata: {
            navLabel: fixedPageNames[page.slug],
            navPlacement: page.slug === "home" ? "header" : "footer",
            ...(page.metadata ?? {})
          }
        }));
      const customPages = data.pages.filter((page) => page.slug !== "site-settings" && !editableSlugs.includes(page.slug));
      const editablePages = [...fixedPages, ...customPages];
      setPages(editablePages);
      if (editablePages.length > 0) {
        setSelectedPage(editablePages[0]);
        setDraft(JSON.parse(JSON.stringify(editablePages[0])));
      }
    } catch (error) {
      pushToast({
        title: "Failed to load pages",
        message: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  function selectPage(index: number) {
    setSelectedPageIndex(index);
    const page = pages[index];
    setSelectedPage(page);
    setDraft(JSON.parse(JSON.stringify(page)));
    setSelectedSectionIndex(0);
  }

  function updateCurrentSection(patch: Partial<CmsSection>) {
    if (!draft || !draft.sections) return;

    const updated = [...draft.sections];
    updated[selectedSectionIndex] = { ...updated[selectedSectionIndex], ...patch };
    setDraft({ ...draft, sections: updated });
  }

  function updatePageMetadata(patch: Record<string, any>) {
    if (!draft) return;
    setDraft({ ...draft, metadata: { ...(draft.metadata ?? {}), ...patch } });
  }

  async function handleSectionImage(file?: File) {
    if (!file || !currentSection) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 1_500_000) {
      pushToast({ title: "Image is too large", message: "Please choose a smaller image for this section.", tone: "error" });
      return;
    }
    updateCurrentSection({ imageUrl: dataUrl });
  }

  async function handleSectionVideo(file?: File) {
    if (!file || !currentSection) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 8_000_000) {
      pushToast({ title: "Video is too large", message: "Please upload a shorter compressed video for this section.", tone: "error" });
      return;
    }
    updateCurrentSection({
      metadata: {
        ...(currentSection.metadata ?? {}),
        videoUrl: dataUrl
      } as any
    });
  }

  function createNewPage() {
    const title = newPageForm.title.trim();
    const slug = newPageForm.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!title || !slug) {
      pushToast({ title: "Page needs title and slug", message: "Add a page name and URL slug.", tone: "error" });
      return;
    }
    if (pages.some((page) => page.slug === slug)) {
      pushToast({ title: "Page already exists", message: "Use a different slug for this page.", tone: "error" });
      return;
    }
    const page: CmsPage = {
      slug,
      title,
      content: title,
      metaTitle: title,
      metaDescription: "",
      published: true,
      metadata: {
        navLabel: newPageForm.navLabel.trim() || title,
        navPlacement: newPageForm.navPlacement
      },
      sections: [
        {
          sectionKey: "intro",
          label: "Intro",
          eyebrow: null,
          title,
          content: "Add page content here.",
          sortOrder: 1,
          sectionType: "block",
          published: true,
          isVisible: true
        }
      ]
    };
    const nextPages = [...pages, page];
    setPages(nextPages);
    setSelectedPageIndex(nextPages.length - 1);
    setSelectedPage(page);
    setDraft(JSON.parse(JSON.stringify(page)));
    setSelectedSectionIndex(0);
    setNewPageForm({ title: "", slug: "", navLabel: "", navPlacement: "footer" });
    setShowNewPage(false);
  }

  function addSection() {
    if (!draft) return;

    const newSection: CmsSection = {
      sectionKey: `section-${Date.now()}`,
      label: "New Section",
      title: "Section Title",
      content: "Section content goes here",
      sortOrder: (draft.sections?.length ?? 0) + 1,
      sectionType: "block",
      published: true
    };

    setDraft({
      ...draft,
      sections: [...(draft.sections ?? []), newSection]
    });
    setSelectedSectionIndex((draft.sections?.length ?? 0));
    setShowNewSection(false);
  }

  function deleteSection(index: number) {
    if (!draft || !draft.sections) return;

    const updated = draft.sections.filter((_, i) => i !== index);
    setDraft({ ...draft, sections: updated });
    setSelectedSectionIndex(Math.max(0, index - 1));
    setDeleteSectionIndex(null);
  }

  function moveSection(index: number, direction: "up" | "down") {
    if (!draft || !draft.sections) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= draft.sections.length) return;

    const updated = [...draft.sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    updated.forEach((section, i) => {
      section.sortOrder = i + 1;
    });

    setDraft({ ...draft, sections: updated });
    setSelectedSectionIndex(newIndex);
  }

  function applyTextFormatting(format: "bold" | "italic" | "link" | "code") {
    const textarea = document.querySelector("textarea[data-format-target]") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || "text";

    let formatted = selectedText;
    switch (format) {
      case "bold":
        formatted = `**${selectedText}**`;
        break;
      case "italic":
        formatted = `*${selectedText}*`;
        break;
      case "link":
        formatted = `[${selectedText}](url)`;
        break;
      case "code":
        formatted = "`" + selectedText + "`";
        break;
    }

    const newContent = text.substring(0, start) + formatted + text.substring(end);
    updateCurrentSection({ content: newContent });
  }

  function addBadgeToTitle() {
    if (!currentSection || !badgeText) return;

    const badge = {
      text: badgeText,
      icon: badgeIcon || undefined,
      id: `badge-${Date.now()}`
    };

    const badges = currentSection.metadata?.badges || [];
    updateCurrentSection({
      metadata: {
        ...currentSection.metadata,
        badges: [...badges, badge]
      } as any
    });

    setBadgeText("");
    setBadgeIcon("");
    setShowBadgeModal(false);
  }

  function removeBadge(badgeId: string) {
    if (!currentSection) return;

    const badges = (currentSection.metadata?.badges || []).filter((b: any) => b.id !== badgeId);
    updateCurrentSection({
      metadata: {
        ...currentSection.metadata,
        badges
      } as any
    });
  }

  async function savePage() {
    if (!draft || !token) return;

    setSaving(true);
    try {
      const data = await apiFetch<{ page: CmsPage }>("/admin/cms", {
        method: "POST",
        token,
        body: JSON.stringify({
          slug: draft.slug,
          title: draft.title,
          content: draft.content,
          metaTitle: draft.metaTitle,
          metaDescription: draft.metaDescription,
          published: draft.published ?? true,
          metadata: draft.metadata,
          sections: draft.sections ?? []
        })
      });

      setSelectedPage(data.page);
      setDraft(data.page);
      setPages((current) => current.map((page) => (page.slug === data.page.slug ? data.page : page)));
      pushToast({
        title: "Page saved",
        message: "CMS page has been updated successfully.",
        tone: "success"
      });
    } catch (error) {
      pushToast({
        title: "Failed to save",
        message: error instanceof Error ? error.message : "Unknown error",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentSection = draft?.sections?.[selectedSectionIndex];

  // Responsive preview dimensions
  const previewDimensions = {
    desktop: { width: 1024, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  };

  const currentDimensions = previewDimensions[previewDevice];

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Page Selector */}
      <div className="border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {pages.map((page, idx) => (
              <button
                key={page.slug}
                onClick={() => selectPage(idx)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold transition whitespace-nowrap",
                  selectedPageIndex === idx
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                )}
              >
                {pageDisplayName(page)}
              </button>
            ))}
          </div>
          {/* Page Navigation */}
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Button type="button" variant="secondary" className="h-9 rounded-md px-3" onClick={() => setShowNewPage(true)}>
              <Plus className="h-4 w-4" />
              New page
            </Button>
            <button
              onClick={() => selectPage(Math.max(0, selectedPageIndex - 1))}
              disabled={selectedPageIndex === 0}
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => selectPage(Math.min(pages.length - 1, selectedPageIndex + 1))}
              disabled={selectedPageIndex === pages.length - 1}
              className="p-2 rounded hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Sections</h3>
            <Button
              variant="secondary"
              onClick={() => setShowNewSection(true)}
              className="h-8 w-8 p-0 px-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {draft?.sections?.map((section, index) => (
              <div
                key={section.sectionKey || index}
                onClick={() => setSelectedSectionIndex(index)}
                className={cn(
                  "cursor-pointer rounded-md p-3 transition",
                  selectedSectionIndex === index
                    ? "bg-primary/10 border border-primary dark:bg-primary/20"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary dark:text-blue-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {section.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section.sectionType || "block"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentSection ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                {(["content", "seo", "styling", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 px-4 py-3 text-sm font-semibold transition border-b-2 capitalize",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "content" && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <Navigation className="h-4 w-4 text-primary" />
                        Page identity and navigation
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          CMS page name
                          <Input value={draft?.title ?? ""} onChange={(e) => draft && setDraft({ ...draft, title: e.target.value })} />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          URL slug
                          <Input value={draft?.slug ?? ""} disabled />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Header/Footer label
                          <Input
                            value={draft?.metadata?.navLabel ?? pageDisplayName(draft!)}
                            onChange={(e) => updatePageMetadata({ navLabel: e.target.value })}
                            placeholder="Navigation label"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Show page link
                          <select
                            value={draft?.metadata?.navPlacement ?? "footer"}
                            onChange={(e) => updatePageMetadata({ navPlacement: e.target.value })}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            <option value="hidden">Hidden from navigation</option>
                            <option value="footer">Footer only</option>
                            <option value="header">Header dropdown</option>
                            <option value="both">Header dropdown and footer</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Section Label
                      </label>
                      <Input
                        value={currentSection.label}
                        onChange={(e) => updateCurrentSection({ label: e.target.value })}
                        placeholder="e.g., Hero Section"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Section Type
                      </label>
                      <select
                        value={currentSection.sectionType || "block"}
                        onChange={(e) => updateCurrentSection({ sectionType: e.target.value as SectionType })}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      >
                        <option value="block">Block</option>
                        <option value="grid">Grid</option>
                        <option value="flex">Flex</option>
                        <option value="carousel">Carousel</option>
                        <option value="media">Media</option>
                        <option value="split">Split</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Eyebrow
                      </label>
                      <Input
                        value={currentSection.eyebrow || ""}
                        onChange={(e) => updateCurrentSection({ eyebrow: e.target.value || undefined })}
                        placeholder="Optional subtitle"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Title
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={currentSection.title}
                          onChange={(e) => updateCurrentSection({ title: e.target.value })}
                          placeholder="Section title"
                          className="flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => setShowBadgeModal(true)}
                          className="h-10 px-3"
                        >
                          <BadgeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {currentSection.metadata?.badges && (currentSection.metadata.badges as any[]).length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {(currentSection.metadata.badges as any[]).map((badge) => (
                            <div
                              key={badge.id}
                              className="inline-flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 px-2 py-1 rounded text-xs"
                            >
                              {badge.icon && <span>{badge.icon}</span>}
                              <span>{badge.text}</span>
                              <button onClick={() => removeBadge(badge.id)} className="ml-1 hover:opacity-70">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Content
                      </label>
                      <div className="mb-2 flex gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
                        <button
                          onClick={() => applyTextFormatting("bold")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("italic")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("link")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Link"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => applyTextFormatting("code")}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-600 dark:text-slate-300"
                          title="Code"
                        >
                          <Code className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        data-format-target
                        value={currentSection.content}
                        onChange={(e) => updateCurrentSection({ content: e.target.value })}
                        placeholder="Section content (supports **bold**, *italic*, [links](url), `code`)"
                        className="w-full h-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Use **text** for bold, *text* for italic, [text](url) for links, `code` for code
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          CTA Label
                        </label>
                        <Input
                          value={currentSection.ctaLabel || ""}
                          onChange={(e) => updateCurrentSection({ ctaLabel: e.target.value || undefined })}
                          placeholder="e.g., Get Started"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          CTA Link
                        </label>
                        <Input
                          value={currentSection.ctaHref || ""}
                          onChange={(e) => updateCurrentSection({ ctaHref: e.target.value || undefined })}
                          placeholder="/dashboard"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">Section media</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          Image upload
                          <span className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                            {currentSection.imageUrl ? <img src={currentSection.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Upload image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => {
                                void handleSectionImage(event.target.files?.[0]);
                                event.currentTarget.value = "";
                              }}
                            />
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Video upload
                          <span className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]">
                            <FileVideo className="h-5 w-5 text-slate-400" />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {currentSection.metadata?.videoUrl ? "Replace video" : "Upload one video"}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              className="sr-only"
                              onChange={(event) => {
                                void handleSectionVideo(event.target.files?.[0]);
                                event.currentTarget.value = "";
                              }}
                            />
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Image position
                          <select
                            value={String(currentSection.position ?? 0)}
                            onChange={(e) => updateCurrentSection({ position: Number(e.target.value) })}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            <option value="0">Top</option>
                            <option value="1">Left</option>
                            <option value="2">Right</option>
                            <option value="3">Bottom</option>
                            <option value="4">Background</option>
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Icon name
                          <Input value={currentSection.iconName ?? ""} onChange={(e) => updateCurrentSection({ iconName: e.target.value || undefined })} placeholder="e.g. ShieldCheck" />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                      <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">CTA button controls</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <label className="grid gap-2 text-sm font-semibold">
                          CTA style
                          <select
                            value={currentSection.metadata?.ctaStyle ?? "solid"}
                            onChange={(e) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaStyle: e.target.value } as any })}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            <option value="solid">Background button</option>
                            <option value="outline">Border button</option>
                            <option value="solid-icon">Background with icon</option>
                            <option value="outline-icon">Border with icon</option>
                          </select>
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          CTA icon
                          <Input value={currentSection.metadata?.ctaIcon ?? ""} onChange={(e) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaIcon: e.target.value } as any })} placeholder="ArrowRight" />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Link target
                          <select
                            value={currentSection.metadata?.ctaTarget ?? "_self"}
                            onChange={(e) => updateCurrentSection({ metadata: { ...(currentSection.metadata ?? {}), ctaTarget: e.target.value } as any })}
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            <option value="_self">Same tab</option>
                            <option value="_blank">New tab</option>
                            <option value="new-window">New window</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Page SEO metadata controls search title, keywords, and social preview data for the selected CMS page.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Page SEO Title
                      </label>
                      <Input
                        value={draft?.metaTitle || ""}
                        onChange={(e) => draft && setDraft({ ...draft, metaTitle: e.target.value })}
                        placeholder="Page title for search engines"
                        maxLength={60}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 60 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Page SEO Description
                      </label>
                      <textarea
                        value={draft?.metaDescription || ""}
                        onChange={(e) => draft && setDraft({ ...draft, metaDescription: e.target.value })}
                        placeholder="Page description for search engines"
                        maxLength={160}
                        className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 160 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Short keywords
                      </label>
                      <Input
                        value={draft?.metadata?.shortKeywords || ""}
                        onChange={(e) => updatePageMetadata({ shortKeywords: e.target.value })}
                        placeholder="Up to 8 short keywords, comma separated"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Long keywords
                      </label>
                      <textarea
                        value={draft?.metadata?.longKeywords || ""}
                        onChange={(e) => updatePageMetadata({ longKeywords: e.target.value })}
                        placeholder="Up to 4 long-tail SEO keyword phrases"
                        className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Open Graph</h3>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Image URL
                        </label>
                        <Input
                          value={draft?.metadata?.ogImage || ""}
                          onChange={(e) => updatePageMetadata({ ogImage: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Title
                        </label>
                        <Input
                          value={draft?.metadata?.ogTitle || ""}
                          onChange={(e) => updatePageMetadata({ ogTitle: e.target.value })}
                          placeholder="Title for social sharing"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Description
                        </label>
                        <textarea
                          value={draft?.metadata?.ogDescription || ""}
                          onChange={(e) => updatePageMetadata({ ogDescription: e.target.value })}
                          placeholder="Description for social sharing"
                          className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "styling" && (
                  <div className="space-y-6 max-w-4xl">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Theme Mode
                      </label>
                      <div className="space-y-2">
                        {["light", "dark", "both"].map((mode) => (
                          <label key={mode} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value={mode}
                              checked={(currentSection.metadata?.themeMode as string) === mode || (mode === "both" && !currentSection.metadata?.themeMode)}
                              onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, themeMode: e.target.value } as any })}
                              className="rounded"
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                              {mode === "both" ? "Light & Dark (Auto)" : mode}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Choose which theme mode(s) this section should be visible in
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Color Scheme
                      </label>
                      <select
                        value={currentSection.colorScheme || ""}
                        onChange={(e) => updateCurrentSection({ colorScheme: e.target.value || undefined })}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      >
                        <option value="">Auto (Light/Dark)</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="primary">Primary</option>
                        <option value="accent">Accent</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={currentSection.isVisible !== false}
                          onChange={(e) => updateCurrentSection({ isVisible: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">Visible on page</span>
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === "preview" && (
                  <div className="max-w-6xl">
                    <div className="mb-6 flex gap-2 justify-center">
                      {[
                        { device: "mobile" as PreviewDevice, icon: Smartphone, label: "Mobile" },
                        { device: "tablet" as PreviewDevice, icon: Tablet, label: "Tablet" },
                        { device: "desktop" as PreviewDevice, icon: Monitor, label: "Desktop" }
                      ].map(({ device, icon: Icon, label }) => (
                        <button
                          key={device}
                          onClick={() => setPreviewDevice(device)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-md transition",
                            previewDevice === device
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center">
                      <div
                        style={{
                          width: currentDimensions.width,
                          height: currentDimensions.height
                        }}
                        className="border-4 border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900"
                      >
                        <div className="p-8 h-full overflow-y-auto">
                          {currentSection.eyebrow && (
                            <p className="text-sm font-semibold text-primary dark:text-blue-400 mb-2 uppercase">
                              {currentSection.eyebrow}
                            </p>
                          )}

                          {currentSection.metadata?.badges && (currentSection.metadata.badges as any[]).length > 0 && (
                            <div className="flex gap-2 mb-4 flex-wrap">
                              {(currentSection.metadata.badges as any[]).map((badge) => (
                                <div
                                  key={badge.id}
                                  className="inline-flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 px-3 py-1 rounded text-sm"
                                >
                                  {badge.icon && <span>{badge.icon}</span>}
                                  <span>{badge.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            {currentSection.title}
                          </h2>
                          {currentSection.imageUrl ? (
                            <img src={currentSection.imageUrl} alt="" className="mb-6 max-h-72 w-full rounded-lg object-cover" />
                          ) : null}
                          {currentSection.metadata?.videoUrl ? (
                            <video src={currentSection.metadata.videoUrl} className="mb-6 max-h-72 w-full rounded-lg bg-slate-950" controls />
                          ) : null}
                          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-wrap">
                            {currentSection.content}
                          </p>
                          {currentSection.ctaLabel && (
                            <button className={cn(
                              "inline-flex items-center gap-2 px-6 py-2 rounded-md font-semibold",
                              currentSection.metadata?.ctaStyle?.includes("outline")
                                ? "border border-primary text-primary"
                                : "bg-primary text-white hover:bg-primary/90"
                            )}>
                              {currentSection.metadata?.ctaStyle?.includes("icon") ? <ExternalLink className="h-4 w-4" /> : null}
                              {currentSection.ctaLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Controls */}
              <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02] flex gap-2 justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 w-8 p-0 px-0"
                    onClick={() => moveSection(selectedSectionIndex, "up")}
                    disabled={selectedSectionIndex === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 w-8 p-0 px-0"
                    onClick={() => moveSection(selectedSectionIndex, "down")}
                    disabled={selectedSectionIndex === (draft?.sections?.length ?? 0) - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 w-8 p-0 px-0"
                    onClick={() => setDeleteSectionIndex(selectedSectionIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={savePage} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No sections available
            </div>
          )}
        </div>
      </div>

      {/* New Section Modal */}
      <Modal open={showNewSection} title="Add New Section" onClose={() => setShowNewSection(false)}>
        <div className="p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            A new blank section will be added at the end of this page. You can customize it immediately.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowNewSection(false)}>
              Cancel
            </Button>
            <Button onClick={addSection}>
              Add Section
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showNewPage} title="Create CMS Page" onClose={() => setShowNewPage(false)}>
        <div className="grid gap-4 p-4">
          <label className="grid gap-2 text-sm font-semibold">
            Page title
            <Input
              value={newPageForm.title}
              onChange={(e) => {
                const title = e.target.value;
                setNewPageForm((current) => ({
                  ...current,
                  title,
                  slug: current.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
                  navLabel: current.navLabel || title
                }));
              }}
              placeholder="New page name"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            URL slug
            <Input value={newPageForm.slug} onChange={(e) => setNewPageForm((current) => ({ ...current, slug: e.target.value }))} placeholder="new-page" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Navigation label
            <Input value={newPageForm.navLabel} onChange={(e) => setNewPageForm((current) => ({ ...current, navLabel: e.target.value }))} placeholder="Footer/header text" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Show page link
            <select
              value={newPageForm.navPlacement}
              onChange={(e) => setNewPageForm((current) => ({ ...current, navPlacement: e.target.value as typeof current.navPlacement }))}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              <option value="footer">Footer only</option>
              <option value="header">Header dropdown</option>
              <option value="both">Header dropdown and footer</option>
              <option value="hidden">Hidden from navigation</option>
            </select>
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <Button variant="secondary" onClick={() => setShowNewPage(false)}>Cancel</Button>
            <Button onClick={createNewPage}>Create Page</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteSectionIndex !== null} title="Delete Section" onClose={() => setDeleteSectionIndex(null)}>
        <div className="p-4">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            This section will be removed from the page after you save changes. Are you sure you want to delete it?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteSectionIndex(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteSection(deleteSectionIndex ?? 0)}>
              <Trash2 className="h-4 w-4" />
              Delete section
            </Button>
          </div>
        </div>
      </Modal>

      {/* Badge Modal */}
      <Modal open={showBadgeModal} title="Add Badge to Title" onClose={() => setShowBadgeModal(false)}>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Badge Text
            </label>
            <Input
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="e.g., New, Featured, Premium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Icon (optional)
            </label>
            <Input
              value={badgeIcon}
              onChange={(e) => setBadgeIcon(e.target.value)}
              placeholder="e.g., star, target, lightbulb"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-white/10">
            <Button variant="secondary" onClick={() => setShowBadgeModal(false)}>
              Cancel
            </Button>
            <Button onClick={addBadgeToTitle} disabled={!badgeText}>
              Add Badge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

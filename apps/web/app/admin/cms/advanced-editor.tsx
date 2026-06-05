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
  Smartphone,
  Tablet,
  Monitor,
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
import type { CmsPage, CmsSection } from "@/lib/cms";

type EditorTab = "content" | "seo" | "styling" | "preview";
type SectionType = "block" | "grid" | "flex" | "carousel";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type ThemeMode = "light" | "dark" | "both";

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
      const editablePages = data.pages.filter((page) => page.slug !== "site-settings");
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
                {page.title || page.slug}
              </button>
            ))}
          </div>
          {/* Page Navigation */}
          <div className="flex gap-2 ml-4 flex-shrink-0">
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
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-6 max-w-4xl">
                    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        SEO metadata for this section. This helps with search engine optimization.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Meta Title
                      </label>
                      <Input
                        value={currentSection.metadata?.metaTitle || ""}
                        onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, metaTitle: e.target.value } as any })}
                        placeholder="Page title for search engines"
                        maxLength={60}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 60 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={currentSection.metadata?.metaDescription || ""}
                        onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, metaDescription: e.target.value } as any })}
                        placeholder="Page description for search engines"
                        maxLength={160}
                        className="w-full h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 160 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        Meta Keywords
                      </label>
                      <Input
                        value={currentSection.metadata?.metaKeywords || ""}
                        onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, metaKeywords: e.target.value } as any })}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Open Graph</h3>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Image URL
                        </label>
                        <Input
                          value={currentSection.metadata?.ogImage || ""}
                          onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, ogImage: e.target.value } as any })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Title
                        </label>
                        <Input
                          value={currentSection.metadata?.ogTitle || ""}
                          onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, ogTitle: e.target.value } as any })}
                          placeholder="Title for social sharing"
                        />
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          OG Description
                        </label>
                        <textarea
                          value={currentSection.metadata?.ogDescription || ""}
                          onChange={(e) => updateCurrentSection({ metadata: { ...currentSection.metadata, ogDescription: e.target.value } as any })}
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
                          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-wrap">
                            {currentSection.content}
                          </p>
                          {currentSection.ctaLabel && (
                            <button className="bg-primary text-white px-6 py-2 rounded-md font-semibold hover:bg-primary/90">
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
                    onClick={() => deleteSection(selectedSectionIndex)}
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
              placeholder="e.g., ⭐, 🎯, 💡"
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

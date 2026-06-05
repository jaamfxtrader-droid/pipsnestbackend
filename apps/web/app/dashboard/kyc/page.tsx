"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, ClipboardCheck, FileImage, FileText, IdCard, Loader2, ShieldCheck, UploadCloud, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SwitchField } from "@/components/ui/switch-field";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { kycSections, privacySections, termsSections, type LegalSection } from "@/lib/legal-content";
import { cn } from "@/lib/utils";
import { isRememberedAuth, useAuthStore, type AuthUser } from "@/store/auth-store";

type DocumentType = "PICTURE_ID" | "PASSPORT";
type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

type KycSubmission = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  address: string;
  documentType: DocumentType;
  documentFrontUrl: string;
  documentBackUrl: string;
  status: KycStatus;
  acceptedPolicies: boolean;
  adminNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
};

type KycForm = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  address: string;
  documentType: DocumentType;
  documentFrontUrl: string;
  documentBackUrl: string;
  acceptedPolicies: boolean;
};

type PolicyTab = "kyc" | "terms" | "privacy";

const policyContent: Record<PolicyTab, { label: string; title: string; sections: LegalSection[] }> = {
  kyc: { label: "KYC Policy", title: "KYC Policy", sections: kycSections },
  terms: { label: "Terms", title: "Terms & Conditions", sections: termsSections },
  privacy: { label: "Privacy", title: "Privacy Policy", sections: privacySections }
};

function splitName(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.at(-1) ?? "" : "",
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : ""
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function statusMeta(status?: KycStatus | null) {
  if (status === "APPROVED") {
    return {
      label: "Approved",
      description: "Your identity verification is approved.",
      className: "border-profit/25 bg-profit/10 text-green-700 dark:text-green-300",
      icon: CheckCircle2
    };
  }
  if (status === "REJECTED") {
    return {
      label: "Rejected",
      description: "Please review the note and submit updated documents.",
      className: "border-loss/25 bg-loss/10 text-red-700 dark:text-red-300",
      icon: X
    };
  }
  if (status === "PENDING") {
    return {
      label: "Under review",
      description: "Approval usually takes 24-72 hours after submission.",
      className: "border-warning/25 bg-warning/10 text-amber-700 dark:text-amber-300",
      icon: Loader2
    };
  }
  return {
    label: "Not submitted",
    description: "Submit your identity details to unlock account reviews and payouts.",
    className: "border-primary/20 bg-primary/10 text-blue-700 dark:text-blue-300",
    icon: ShieldCheck
  };
}

function DocumentUploadBox({
  label,
  hint,
  value,
  onFile
}: {
  label: string;
  hint: string;
  value: string;
  onFile: (file?: File) => void;
}) {
  const hasPreview = value.startsWith("data:image/") || /^https?:\/\//.test(value);

  return (
    <label className="group relative grid min-h-[14rem] cursor-pointer overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-primary/60 hover:bg-blue-50 dark:border-white/15 dark:bg-white/[0.04] dark:hover:bg-primary/10">
      {hasPreview ? (
        <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:scale-[1.02]" />
      ) : null}
      <span className={cn("relative z-10 grid h-full place-items-center rounded-md", hasPreview && "bg-slate-950/55 text-white")}>
        <span className="grid max-w-xs place-items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-md bg-white text-primary shadow-sm dark:bg-slate-950">
            {hasPreview ? <FileImage className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
          </span>
          <span className="mt-3 text-sm font-bold">{value ? `${label} selected` : label}</span>
          <span className={cn("mt-1 text-xs font-medium text-slate-500 dark:text-slate-400", hasPreview && "text-white/80")}>{hint}</span>
        </span>
      </span>
      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
    </label>
  );
}

function PolicyModal({
  open,
  activeTab,
  onTabChange,
  onClose,
  onAccept
}: {
  open: boolean;
  activeTab: PolicyTab;
  onTabChange: (tab: PolicyTab) => void;
  onClose: () => void;
  onAccept: () => void;
}) {
  if (!open) return null;

  const content = policyContent[activeTab];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
          <div>
            <div className="text-xs font-bold uppercase text-primary">PipNest Markets</div>
            <h2 className="mt-1 text-xl font-semibold">{content.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close policy modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
          {Object.entries(policyContent).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key as PolicyTab)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                activeTab === key
                  ? "bg-primary text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid gap-4">
            {content.sections.map((section) => (
              <section key={`${content.title}-${section.title}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <h3 className="font-semibold">{section.title}</h3>
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Accepting confirms you agree to the KYC Policy, Terms & Conditions, and Privacy Policy.</p>
          <Button type="button" onClick={onAccept} className="shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function KycVerificationPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const pushToast = useToast((state) => state.push);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestKyc, setLatestKyc] = useState<KycSubmission | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>("kyc");
  const [form, setForm] = useState<KycForm>({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    address: "",
    documentType: "PICTURE_ID",
    documentFrontUrl: "",
    documentBackUrl: "",
    acceptedPolicies: false
  });

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  useEffect(() => {
    if (scope !== "user" || !token) return;

    apiFetch<{ user: AuthUser }>("/auth/me", { token })
      .then((data) => {
        setAuth(token, data.user, { remember: isRememberedAuth("user"), scope: "user" });
      })
      .catch(() => undefined);
  }, [scope, setAuth, token]);

  useEffect(() => {
    if (!token || scope !== "user") return;

    let active = true;
    setLoading(true);
    apiFetch<{ user: { name: string; phone?: string | null }; phone?: string | null; kyc: KycSubmission | null }>("/kyc/me", { token })
      .then((data) => {
        if (!active) return;
        const names = splitName(data.user.name);
        setLatestKyc(data.kyc);
        setForm((current) => ({
          ...current,
          firstName: data.kyc?.firstName ?? (current.firstName || names.firstName),
          lastName: data.kyc?.lastName ?? (current.lastName || names.lastName),
          middleName: data.kyc?.middleName ?? (current.middleName || names.middleName),
          phone: data.phone ?? "",
          address: data.kyc?.address ?? current.address,
          documentType: data.kyc?.documentType ?? current.documentType,
          acceptedPolicies: Boolean(data.kyc?.acceptedPolicies && data.kyc.status !== "REJECTED")
        }));
      })
      .catch((error) => {
        pushToast({
          title: "KYC data not loaded",
          message: error instanceof Error ? error.message : "Please refresh and try again.",
          tone: "error"
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pushToast, scope, token]);

  useEffect(() => {
    if (!user || form.phone) return;
    const names = splitName(user.name);
    setForm((current) => ({
      ...current,
      firstName: current.firstName || names.firstName,
      lastName: current.lastName || names.lastName,
      middleName: current.middleName || names.middleName,
      phone: user.phone ?? current.phone
    }));
  }, [form.phone, user]);

  const meta = statusMeta(latestKyc?.status);
  const StatusIcon = meta.icon;
  const locked = latestKyc?.status === "PENDING" || latestKyc?.status === "APPROVED";
  const documentLabel = form.documentType === "PASSPORT" ? "Passport" : "Picture ID";
  const canSubmit =
    !locked &&
    Boolean(form.firstName.trim()) &&
    Boolean(form.lastName.trim()) &&
    Boolean(form.phone.trim()) &&
    Boolean(form.address.trim()) &&
    Boolean(form.documentFrontUrl) &&
    Boolean(form.documentBackUrl) &&
    form.acceptedPolicies;

  const submittedAt = useMemo(() => {
    if (!latestKyc?.submittedAt) return null;
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latestKyc.submittedAt));
  }, [latestKyc?.submittedAt]);

  function updateField<Key extends keyof KycForm>(key: Key, value: KycForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleDocumentFile(key: "documentFrontUrl" | "documentBackUrl", file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl.length > 8_000_000) {
      pushToast({
        title: "Document is too large",
        message: "Please upload a smaller PNG, JPG, or WEBP file.",
        tone: "error"
      });
      return;
    }
    updateField(key, dataUrl);
  }

  async function submitKyc() {
    if (!token) return;
    if (!canSubmit) {
      pushToast({
        title: "KYC not ready",
        message: "Complete details, upload front and back images, and accept policies.",
        tone: "error"
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiFetch<{ kyc: KycSubmission; message: string }>("/kyc", {
        method: "POST",
        token,
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName,
          address: form.address,
          documentType: form.documentType,
          documentFrontUrl: form.documentFrontUrl,
          documentBackUrl: form.documentBackUrl,
          acceptedPolicies: form.acceptedPolicies
        })
      });
      setLatestKyc(data.kyc);
      setForm((current) => ({ ...current, documentFrontUrl: data.kyc.documentFrontUrl, documentBackUrl: data.kyc.documentBackUrl }));
      pushToast({ title: "KYC submitted", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "KYC not submitted",
        message: error instanceof Error ? error.message : "Please check the form and try again.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="KYC Verification" description="Submit your identity details and documents for account verification." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
                <IdCard className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Identity information</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Use the same legal name shown on your document.</p>
              </div>
            </div>
            <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold", meta.className)}>
              <StatusIcon className={cn("h-4 w-4", latestKyc?.status === "PENDING" && "animate-spin")} />
              {meta.label}
            </span>
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold">
                  First name
                  <Input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} disabled={locked} autoComplete="given-name" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Middle name <span className="text-xs font-medium text-slate-500">Optional</span>
                  <Input value={form.middleName} onChange={(event) => updateField("middleName", event.target.value)} disabled={locked} autoComplete="additional-name" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Last name
                  <Input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} disabled={locked} autoComplete="family-name" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
                <label className="grid gap-2 text-sm font-semibold">
                  Phone number
                  <Input value={form.phone || "Add phone in Trader Settings"} disabled className="bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Residential address
                  <textarea
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    disabled={locked}
                    rows={3}
                    className="min-h-[6.5rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-white/10 dark:text-white dark:disabled:bg-white/5"
                    placeholder="Street, city, state, postal code, country"
                    autoComplete="street-address"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
                  <div>
                    <label className="grid gap-2 text-sm font-semibold">
                      Document type
                      <Select
                        value={form.documentType}
                        onChange={(event) => updateField("documentType", event.target.value as DocumentType)}
                        disabled={locked}
                      >
                        <option value="PICTURE_ID">Picture ID</option>
                        <option value="PASSPORT">Passport</option>
                      </Select>
                    </label>
                    <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                      <div className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
                        <FileText className="h-4 w-4 text-primary" />
                        Upload guide
                      </div>
                      <p className="mt-2 leading-6">Upload clear front and back images. Keep all corners visible, avoid glare, and make sure the document name matches your account name.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <DocumentUploadBox
                      label={`${documentLabel} front`}
                      hint="PNG, JPG, or WEBP"
                      value={form.documentFrontUrl}
                      onFile={(file) => handleDocumentFile("documentFrontUrl", file)}
                    />
                    <DocumentUploadBox
                      label={`${documentLabel} back`}
                      hint="PNG, JPG, or WEBP"
                      value={form.documentBackUrl}
                      onFile={(file) => handleDocumentFile("documentBackUrl", file)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <SwitchField
                  checked={form.acceptedPolicies}
                  onChange={(checked) => {
                    if (!checked) {
                      updateField("acceptedPolicies", false);
                      return;
                    }
                    setPolicyTab("kyc");
                    setPolicyOpen(true);
                  }}
                  disabled={locked}
                  label="I accept KYC policy, terms, and privacy policy"
                  description="Open and review the policy text before accepting."
                />
                <Button type="button" onClick={submitKyc} disabled={!canSubmit || submitting} className="w-full lg:w-auto">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                  Submit KYC
                </Button>
              </div>
            </div>
          )}
        </section>

        <aside className="grid gap-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-profit/10 text-green-700 dark:text-green-300">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Approval time</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">24-72 hours</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">The review team checks legal name, phone ownership, document clarity, and policy acceptance. You will get a dashboard notification after approval or rejection.</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Latest submission</div>
            <div className="mt-3 flex items-center gap-3">
              <span className={cn("grid h-10 w-10 place-items-center rounded-md", meta.className)}>
                <StatusIcon className={cn("h-5 w-5", latestKyc?.status === "PENDING" && "animate-spin")} />
              </span>
              <div>
                <p className="font-semibold">{meta.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{submittedAt ?? "No submission yet"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{meta.description}</p>
            {latestKyc?.adminNote ? (
              <div className="mt-4 rounded-md border border-warning/20 bg-warning/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Review note:</span> {latestKyc.adminNote}
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <PolicyModal
        open={policyOpen}
        activeTab={policyTab}
        onTabChange={setPolicyTab}
        onClose={() => setPolicyOpen(false)}
        onAccept={() => {
          updateField("acceptedPolicies", true);
          setPolicyOpen(false);
        }}
      />
    </>
  );
}

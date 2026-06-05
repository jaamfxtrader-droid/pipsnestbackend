"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileImage, IdCard, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

type KycSubmission = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  phone: string;
  address: string;
  documentType: "PICTURE_ID" | "PASSPORT";
  documentFrontUrl: string;
  documentBackUrl: string;
  status: KycStatus;
  adminNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  };
};

function statusTone(status: KycStatus): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "APPROVED") return "profit";
  if (status === "REJECTED") return "loss";
  return "warning";
}

function formatDate(value?: string | null) {
  if (!value) return "Not reviewed";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function isImage(url: string) {
  return url.startsWith("data:image/") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) || url.includes("/image/upload/");
}

function DocumentLink({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group grid min-h-[14rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.04]"
    >
      {isImage(url) ? (
        <img src={url} alt="" className="h-full min-h-[14rem] w-full object-cover transition group-hover:scale-[1.02]" />
      ) : (
        <span className="grid place-items-center p-6 text-center">
          <FileImage className="h-8 w-8 text-primary" />
          <span className="mt-3 text-sm font-semibold">{label}</span>
        </span>
      )}
      <span className="border-t border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-slate-950">{label}</span>
    </a>
  );
}

export default function AdminKycPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const pushToast = useToast((state) => state.push);
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ submissions: KycSubmission[] }>("/admin/kyc", { token: authToken });
      setSubmissions(data.submissions);
      setSelectedId((current) => current || data.submissions[0]?.id || "");
    } catch (error) {
      pushToast({
        title: "KYC queue not loaded",
        message: error instanceof Error ? error.message : "Please refresh and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope !== "admin" || !token) return;
    loadData(token);
  }, [scope, token]);

  const selected = useMemo(() => submissions.find((submission) => submission.id === selectedId) ?? submissions[0], [selectedId, submissions]);

  useEffect(() => {
    setNote(selected?.adminNote ?? "");
  }, [selected?.adminNote, selected?.id]);

  async function updateStatus(status: KycStatus) {
    if (!token || !selected) return;
    setSaving(true);
    try {
      const data = await apiFetch<{ kyc: KycSubmission; message: string }>(`/admin/kyc/${selected.id}/status`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status, adminNote: note })
      });
      setSubmissions((current) => current.map((submission) => (submission.id === selected.id ? { ...submission, ...data.kyc, user: submission.user } : submission)));
      pushToast({ title: "KYC updated", message: data.message, tone: "success" });
    } catch (error) {
      pushToast({
        title: "KYC not updated",
        message: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="KYC Reviews" description="Review identity documents and update trader verification status." />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-2">
            <div className="flex items-center gap-2">
              <IdCard className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Review queue</h2>
            </div>
            <button
              type="button"
              onClick={() => loadData(token)}
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:hover:bg-white/10"
              aria-label="Refresh KYC queue"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
          <div className="grid max-h-[720px] gap-2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No KYC submissions yet.</div>
            ) : (
              submissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedId(submission.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    selected?.id === submission.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold">{submission.firstName} {submission.lastName}</span>
                    <Badge tone={statusTone(submission.status)}>{submission.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{submission.user.email}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(submission.submittedAt)}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {selected ? (
            <>
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.firstName} {selected.middleName ? `${selected.middleName} ` : ""}{selected.lastName}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.user.name} / {selected.user.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.phone} / {selected.documentType.replace("_", " ")}</p>
                  </div>
                  <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Residential address</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{selected.address}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Review timing</div>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">Submitted: {formatDate(selected.submittedAt)}</p>
                    <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">Reviewed: {formatDate(selected.reviewedAt)}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <DocumentLink url={selected.documentFrontUrl} label="Document front" />
                  <DocumentLink url={selected.documentBackUrl} label="Document back" />
                </div>

                <label className="grid gap-2 text-sm font-semibold">
                  Admin note
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    className="min-h-[7rem] rounded-md border border-slate-300/30 bg-white px-3 py-2 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                    placeholder="Add a rejection reason or internal note"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => updateStatus("PENDING")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Mark Pending
                  </Button>
                  <Button type="button" variant="danger" onClick={() => updateStatus("REJECTED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                  <Button type="button" onClick={() => updateStatus("APPROVED")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[26rem] place-items-center p-8 text-center text-slate-500 dark:text-slate-400">
              No KYC submission selected.
            </div>
          )}
        </section>
      </div>
    </>
  );
}

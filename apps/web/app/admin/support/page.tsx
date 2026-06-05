"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Paperclip, Send, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch, apiWebSocketUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore, type AuthUser } from "@/store/auth-store";

type TicketMessage = {
  id: string;
  message: string;
  isStaff: boolean;
  attachments: string[];
  createdAt: string;
  sender?: { id: string; name: string; email: string };
};

type Ticket = {
  id: string;
  subject: string;
  category: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedAdminId?: string | null;
  createdAt: string;
  user: AuthUser;
  messages: TicketMessage[];
};

function statusTone(status: Ticket["status"]): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "RESOLVED" || status === "CLOSED") return "profit";
  if (status === "IN_PROGRESS") return "primary";
  return "warning";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function AttachmentList({ attachments }: { attachments: string[] }) {
  if (!attachments.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <a
          key={`${attachment}-${index}`}
          href={attachment}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span className="truncate">Attachment {index + 1}</span>
        </a>
      ))}
    </div>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const currentUser = useAuthStore((state) => state.user);
  const pushToast = useToast((state) => state.push);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [admins, setAdmins] = useState<AuthUser[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrate("admin");
  }, [hydrate]);

  async function loadData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const [ticketData, userData] = await Promise.all([
        apiFetch<{ tickets: Ticket[] }>("/admin/support/tickets", { token: authToken }),
        apiFetch<{ users: AuthUser[] }>("/admin/admins", { token: authToken })
      ]);
      setTickets(ticketData.tickets);
      setAdmins(userData.users);
      setSelectedTicketId((current) => current || ticketData.tickets[0]?.id || "");
    } catch (error) {
      pushToast({
        title: "Support queue not loaded",
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
    const timer = window.setInterval(() => loadData(token), 10_000);
    return () => window.clearInterval(timer);
  }, [scope, token]);

  useEffect(() => {
    if (!token || !selectedTicketId) return;
    const socket = new WebSocket(apiWebSocketUrl("/support/live", { token, ticketId: selectedTicketId }));
    socket.onmessage = () => loadData(token);
    return () => socket.close();
  }, [selectedTicketId, token]);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0], [selectedTicketId, tickets]);

  async function updateStatus(status: Ticket["status"]) {
    if (!token || !selectedTicket) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/support/tickets/${selectedTicket.id}/status`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status })
      });
      await loadData(token);
    } finally {
      setSaving(false);
    }
  }

  async function assignTicket(assignedAdminId: string) {
    if (assignedAdminId === "__create_admin") {
      router.push("/admin/settings?createAdmin=support");
      return;
    }
    if (!token || !selectedTicket) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/support/tickets/${selectedTicket.id}/assign`, {
        method: "PUT",
        token,
        body: JSON.stringify({ assignedAdminId: assignedAdminId || null })
      });
      await loadData(token);
    } finally {
      setSaving(false);
    }
  }

  async function sendReply() {
    if (!token || !selectedTicket || (!reply.trim() && !replyAttachments.length)) return;
    setSaving(true);
    try {
      await apiFetch(`/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        token,
        body: JSON.stringify({ message: reply, attachments: replyAttachments })
      });
      setReply("");
      setReplyAttachments([]);
      await loadData(token);
    } finally {
      setSaving(false);
    }
  }

  async function addReplyAttachments(files: FileList | null) {
    if (!files?.length) return;
    const encoded: string[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (file.size > 8_000_000) {
        pushToast({ title: "Attachment skipped", message: `${file.name} is larger than 8MB.`, tone: "error" });
        continue;
      }
      encoded.push(await fileToDataUrl(file));
    }
    setReplyAttachments((current) => [...current, ...encoded].slice(0, 4));
  }

  return (
    <>
      <PageHeader title="Support Ticket Management" description="Assign staff, update ticket status, and reply to trader support threads." />
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 px-2 pt-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Queue</h2>
          </div>
          <div className="grid max-h-[720px] gap-2 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No tickets found.</div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition",
                    selectedTicket?.id === ticket.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-slate-200 bg-slate-50 hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-semibold">{ticket.subject}</span>
                    <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{ticket.user.email}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {selectedTicket ? (
            <>
              <div className="border-b border-slate-200 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{selectedTicket.subject}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedTicket.user.name} / {selectedTicket.user.email}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedTicket.category} / {selectedTicket.priority} / {formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(selectedTicket.status)}>{selectedTicket.status}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Select value={selectedTicket.status} onChange={(event) => updateStatus(event.target.value as Ticket["status"])} disabled={saving}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </Select>
                  <Select value={selectedTicket.assignedAdminId ?? ""} onChange={(event) => assignTicket(event.target.value)} disabled={saving}>
                    <option value="">Unassigned</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>{admin.name}{admin.id === currentUser?.id ? " (me)" : ""}</option>
                    ))}
                    <option value="__create_admin">Create support chat admin</option>
                  </Select>
                </div>
              </div>

              <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
                {selectedTicket.messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.isStaff ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[78%] rounded-lg border p-3", message.isStaff ? "border-primary/25 bg-primary/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.05]")}>
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>{message.isStaff ? message.sender?.name ?? "Support" : selectedTicket.user.name}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                      <AttachmentList attachments={message.attachments} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 p-4 dark:border-white/10">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to trader"
                />
                <AttachmentList attachments={replyAttachments} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    <Paperclip className="h-4 w-4" />
                    Attach
                    <input type="file" className="sr-only" multiple accept="image/*,.pdf,.txt,video/*" onChange={(event) => addReplyAttachments(event.target.files)} />
                  </label>
                  <Button type="button" onClick={sendReply} disabled={saving || (!reply.trim() && !replyAttachments.length)}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-[560px] place-items-center p-8 text-center text-sm text-slate-500">
              <MessageSquare className="mb-3 h-8 w-8 text-primary" />
              Select a ticket from the queue.
            </div>
          )}
        </section>
      </div>
    </>
  );
}

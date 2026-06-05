"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, MessageSquare, Paperclip, Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch, apiWebSocketUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

type TicketMessage = {
  id: string;
  message: string;
  isStaff: boolean;
  attachments: string[];
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
};

type Ticket = {
  id: string;
  subject: string;
  category: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function statusTone(status: Ticket["status"]): "primary" | "profit" | "warning" | "loss" | "neutral" {
  if (status === "RESOLVED" || status === "CLOSED") return "profit";
  if (status === "IN_PROGRESS") return "primary";
  return "warning";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function AttachmentList({ attachments }: { attachments: string[] }) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment, index) => {
        const label = attachment.startsWith("http") ? new URL(attachment).pathname.split("/").pop() || `Attachment ${index + 1}` : `Attachment ${index + 1}`;
        return (
          <a
            key={`${attachment}-${index}`}
            href={attachment}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span className="truncate">{label}</span>
          </a>
        );
      })}
    </div>
  );
}

export default function SupportPage() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const user = useAuthStore((state) => state.user);
  const pushToast = useToast((state) => state.push);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "General",
    priority: "MEDIUM",
    message: "",
    attachments: [] as string[]
  });
  const [reply, setReply] = useState({ message: "", attachments: [] as string[] });

  useEffect(() => {
    hydrate("user");
  }, [hydrate]);

  async function loadTickets(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ tickets: Ticket[] }>("/support/tickets/my", { token: authToken });
      setTickets(data.tickets);
      setSelectedTicketId((current) => current || data.tickets[0]?.id || "");
    } catch (error) {
      pushToast({
        title: "Tickets not loaded",
        message: error instanceof Error ? error.message : "Please refresh and try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope !== "user" || !token) return;
    loadTickets(token);
    const timer = window.setInterval(() => loadTickets(token), 10_000);
    return () => window.clearInterval(timer);
  }, [scope, token]);

  useEffect(() => {
    if (!token || !selectedTicketId) return;
    const socket = new WebSocket(apiWebSocketUrl("/support/live", { token, ticketId: selectedTicketId }));
    socket.onmessage = () => loadTickets(token);
    return () => socket.close();
  }, [selectedTicketId, token]);

  const selectedTicket = useMemo(() => tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0], [selectedTicketId, tickets]);

  async function addAttachments(files: FileList | null, target: "new" | "reply") {
    if (!files?.length) return;
    const selectedFiles = Array.from(files).slice(0, 4);
    const encoded: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > 8_000_000) {
        pushToast({ title: "Attachment skipped", message: `${file.name} is larger than 8MB.`, tone: "error" });
        continue;
      }
      encoded.push(await fileToDataUrl(file));
    }

    if (target === "new") {
      setNewTicket((current) => ({ ...current, attachments: [...current.attachments, ...encoded].slice(0, 4) }));
    } else {
      setReply((current) => ({ ...current, attachments: [...current.attachments, ...encoded].slice(0, 4) }));
    }
  }

  async function createTicket() {
    if (!token) return;
    setSubmitting(true);

    try {
      const data = await apiFetch<{ ticket: Ticket }>("/support/tickets", {
        method: "POST",
        token,
        body: JSON.stringify(newTicket)
      });
      setNewTicket({ subject: "", category: "General", priority: "MEDIUM", message: "", attachments: [] });
      setTickets((current) => [data.ticket, ...current]);
      setSelectedTicketId(data.ticket.id);
      pushToast({ title: "Ticket created", message: "Support can now reply in this thread.", tone: "success" });
    } catch (error) {
      pushToast({
        title: "Ticket not created",
        message: error instanceof Error ? error.message : "Please complete the required fields.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendReply() {
    if (!token || !selectedTicket) return;
    setSubmitting(true);

    try {
      await apiFetch<{ message: TicketMessage }>(`/support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        token,
        body: JSON.stringify(reply)
      });
      setReply({ message: "", attachments: [] });
      await loadTickets(token);
    } catch (error) {
      pushToast({
        title: "Reply not sent",
        message: error instanceof Error ? error.message : "Please add a message or attachment.",
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="Support Tickets" description="Create tickets, attach files, and chat with assigned support staff." />
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center gap-2 px-2 pt-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Your Tickets</h2>
          </div>
          <div className="grid max-h-[640px] gap-2 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No tickets yet.</div>
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
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{ticket.category} / {ticket.priority}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {selectedTicket ? (
            <>
              <div className="border-b border-slate-200 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{selectedTicket.subject}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedTicket.category} / {formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <Badge tone={statusTone(selectedTicket.status)}>{selectedTicket.status}</Badge>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {selectedTicket.messages.map((message) => {
                  const mine = message.sender?.id === user?.id;
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[78%] rounded-lg border p-3", mine ? "border-primary/25 bg-primary/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.05]")}>
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>{message.isStaff ? "Support" : message.sender?.name ?? "You"}</span>
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                        {message.message ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.message}</p> : null}
                        <AttachmentList attachments={message.attachments} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 p-4 dark:border-white/10">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
                  value={reply.message}
                  onChange={(event) => setReply((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Type your reply"
                />
                <AttachmentList attachments={reply.attachments} />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                    <Paperclip className="h-4 w-4" />
                    Attach
                    <input type="file" className="sr-only" multiple accept="image/*,.pdf,.txt,video/*" onChange={(event) => addAttachments(event.target.files, "reply")} />
                  </label>
                  <Button type="button" onClick={sendReply} disabled={submitting || (!reply.message.trim() && !reply.attachments.length)}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-slate-500">Create a ticket to start support chat.</div>
          )}
        </section>

        <section className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
              <FileUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-semibold">New Ticket</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Subject, category, priority, message, and optional files.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <Input value={newTicket.subject} onChange={(event) => setNewTicket((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" />
            <Input value={newTicket.category} onChange={(event) => setNewTicket((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
            <Select value={newTicket.priority} onChange={(event) => setNewTicket((current) => ({ ...current, priority: event.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
            <textarea
              className="min-h-32 rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
              value={newTicket.message}
              onChange={(event) => setNewTicket((current) => ({ ...current, message: event.target.value }))}
              placeholder="Message"
            />
            <AttachmentList attachments={newTicket.attachments} />
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary/40 hover:text-primary dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <Paperclip className="h-4 w-4" />
              Add files
              <input type="file" className="sr-only" multiple accept="image/*,.pdf,.txt,video/*" onChange={(event) => addAttachments(event.target.files, "new")} />
            </label>
            <Button type="button" onClick={createTicket} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Create Ticket
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}

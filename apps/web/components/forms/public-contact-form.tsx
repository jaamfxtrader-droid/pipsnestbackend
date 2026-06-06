"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ContactResponse = {
  message: string;
};

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: ""
};

export function PublicContactForm({ title, content }: { title?: string | null; content?: string | null }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const result = await apiFetch<ContactResponse>("/contact", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setStatus("success");
      setFeedback(result.message);
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Message could not be sent. Please email contact@pipnestmarkets.com.");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{content}</p>
      </div>
      <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" required />
      <Input
        value={form.email}
        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        type="email"
        placeholder="Email address"
        required
      />
      <Input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" required />
      <textarea
        value={form.message}
        onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        className="min-h-36 rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white"
        placeholder="Message"
        required
      />
      {feedback ? (
        <p className={status === "success" ? "text-sm font-medium text-emerald-600" : "text-sm font-medium text-red-600"}>{feedback}</p>
      ) : null}
      <Button type="submit" disabled={status === "loading"}>
        <Send className="mr-2 h-4 w-4" />
        {status === "loading" ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

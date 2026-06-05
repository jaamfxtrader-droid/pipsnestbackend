"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  message?: string;
  tone?: "success" | "error" | "info";
  duration?: number;
  createdAt: number;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
};

function clampDuration(duration?: number) {
  return Math.min(Math.max(duration ?? 6000, 2500), 15000);
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID(), createdAt: Date.now(), duration: clampDuration(toast.duration) }].slice(-4)
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));

const tones = {
  success: "border-profit/40 bg-white text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:bg-[#07152d] dark:text-white",
  error: "border-loss/40 bg-white text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:bg-[#07152d] dark:text-white",
  info: "border-primary/40 bg-white text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.16)] dark:bg-[#07152d] dark:text-white"
};

const toneAccents = {
  success: "bg-profit/10 text-green-700 dark:bg-profit/15 dark:text-green-300",
  error: "bg-loss/10 text-red-700 dark:bg-loss/15 dark:text-red-300",
  info: "bg-primary/10 text-blue-700 dark:bg-primary/15 dark:text-blue-300"
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  useEffect(() => {
    const timers = toasts.map((toast) => {
      const remaining = Math.max(0, toast.createdAt + (toast.duration ?? 6000) - Date.now());
      return window.setTimeout(() => dismiss(toast.id), remaining);
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [dismiss, toasts]);

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const Icon = toneIcons[tone];

        return (
          <div
            key={toast.id}
            role="status"
            aria-live={tone === "error" ? "assertive" : "polite"}
            className={cn("flex gap-3 rounded-lg border p-3 text-sm backdrop-blur", tones[tone])}
          >
            <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", toneAccents[tone])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{toast.title}</div>
              {toast.message ? <div className="mt-1 leading-5 text-slate-600 dark:text-slate-300">{toast.message}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

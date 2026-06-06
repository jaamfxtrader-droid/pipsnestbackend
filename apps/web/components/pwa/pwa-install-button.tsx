"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Smartphone, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const slides = [
  {
    image: "/pwa-install-poster-dashboard.svg",
    alt: "PipNest Markets trader dashboard install preview"
  },
  {
    image: "/pwa-install-poster-challenges.svg",
    alt: "PipNest Markets challenge checkout install preview"
  },
  {
    image: "/pwa-install-poster-payouts.svg",
    alt: "PipNest Markets payout tracking install preview"
  },
  {
    image: "/pwa-install-poster-security.svg",
    alt: "PipNest Markets secure access install preview"
  }
];

function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function PwaInstallButton({ label = "Other Install", className }: { label?: string; className?: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preparingInstall, setPreparingInstall] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInstalled(isStandaloneApp());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (!isStandaloneApp()) setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      media.removeEventListener?.("change", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!installing) return;
    const timer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 4));
    }, 80);

    return () => window.clearInterval(timer);
  }, [installing]);

  useEffect(() => {
    if (!sheetOpen || installPrompt) {
      setPreparingInstall(false);
      return;
    }

    setPreparingInstall(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      navigator.serviceWorker.ready.catch(() => undefined);
    }

    const timer = window.setTimeout(() => setPreparingInstall(false), 9000);
    return () => window.clearTimeout(timer);
  }, [installPrompt, sheetOpen]);

  if (!mounted || installed) return null;

  async function handleInstall() {
    const prompt = installPrompt;
    if (!prompt) return;

    setInstalling(true);
    setProgress(8);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setProgress(100);
    window.setTimeout(() => {
      setInstalling(false);
      setSheetOpen(false);
      setInstallPrompt(null);
      if (choice.outcome === "accepted") setInstalled(true);
      else setProgress(0);
    }, 450);
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setSheetOpen(true)} className={cn("shrink-0", className)}>
        <Download className="h-4 w-4" />
        {label}
      </Button>

      {sheetOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:p-5">
          <button type="button" aria-label="Close install prompt" className="absolute inset-0" onClick={() => !installing && setSheetOpen(false)} />
          <div className="relative max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-hidden rounded-t-2xl border border-white/10 bg-[#061126] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)] sm:rounded-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white p-1 shadow-[0_12px_32px_rgba(37,99,235,0.35)]">
                  <img src="/pwa-icon-192.png" alt="" className="h-10 w-10 rounded-full" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-base font-black">Install PipNest Markets</div>
                  <div className="text-xs font-semibold text-blue-100/75">Fast access, app icon, secure dashboard.</div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close install prompt"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
                onClick={() => !installing && setSheetOpen(false)}
              >
                <X className="h-6 w-6 stroke-[2.5]" />
              </button>
            </div>

            <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto p-4">
              <div className="relative mx-auto aspect-[7/12] w-full max-w-[18rem] overflow-hidden rounded-2xl border border-blue-300/15 bg-[#07152d] shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
                <img src={slides[activeSlide].image} alt={slides[activeSlide].alt} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Previous install preview"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/75"
                  onClick={() => setActiveSlide((current) => (current === 0 ? slides.length - 1 : current - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next install preview"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/75"
                  onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 flex justify-center gap-1.5">
                {slides.map((slide, index) => (
                  <button
                    key={slide.image}
                    type="button"
                    aria-label={`Show install preview ${index + 1}`}
                    className={cn("h-2 rounded-full transition", activeSlide === index ? "w-7 bg-blue-400" : "w-2 bg-white/25")}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <Smartphone className="h-5 w-5 text-blue-300" />
                  <div className="mt-2 text-sm font-bold">App-like launch</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                  <div className="mt-2 text-sm font-bold">Clean home icon</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-300" />
                  <div className="mt-2 text-sm font-bold">No extra setup</div>
                </div>
              </div>
              {!installPrompt ? (
                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-sm font-black">{preparingInstall ? "Preparing install" : "Install prompt is still preparing"}</div>
                  <p className="mt-2 text-xs leading-5 text-blue-100/75">
                    Keep this panel open for a moment. PipNest Markets is checking the app manifest, service worker, and install readiness.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/10 p-4">
              {installing ? (
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full"
                    style={{ background: `conic-gradient(#60a5fa ${progress * 3.6}deg, rgba(255,255,255,0.14) 0deg)` }}
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-white">
                      <img src="/pwa-icon-192.png" alt="" className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black">Installing PipNest Markets</div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="text-sm font-black">{progress}%</div>
                </div>
              ) : (
                <Button type="button" className="h-12 w-full justify-center" onClick={handleInstall} disabled={!installPrompt || preparingInstall}>
                  {preparingInstall ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <Download className="h-4 w-4" />}
                  {installPrompt ? "Install app" : preparingInstall ? "Preparing install" : "Install app"}
                </Button>
              )}
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}

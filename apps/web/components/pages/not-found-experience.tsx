"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Home, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function playErrorTone() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.42);
  gain.connect(context.destination);

  const tones = [
    { frequency: 260, start: 0, duration: 0.16 },
    { frequency: 180, start: 0.18, duration: 0.2 }
  ];

  for (const tone of tones) {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, context.currentTime + tone.start);
    oscillator.connect(gain);
    oscillator.start(context.currentTime + tone.start);
    oscillator.stop(context.currentTime + tone.start + tone.duration);
  }

  window.setTimeout(() => context.close().catch(() => undefined), 700);
}

export function NotFoundExperience() {
  const router = useRouter();
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    setReferrer(document.referrer);
    const timer = window.setTimeout(() => {
      try {
        playErrorTone();
      } catch {
        return;
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#061126] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.28),transparent_35%),radial-gradient(circle_at_84%_20%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(180deg,#07152d_0%,#061126_65%,#031022_100%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)] lg:px-8">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-semibold text-blue-100 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.9)]" />
            Route signal lost
          </div>
          <h1 className="mt-6 text-5xl font-black sm:text-6xl lg:text-7xl">404</h1>
          <p className="mt-4 max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">This page slipped out of the trading terminal.</p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            The link may be outdated, moved, or mistyped. You can return to the page you came from, head home, or jump back into the dashboard.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={goBack} className="h-11">
              <ArrowLeft className="h-4 w-4" />
              Return Back
            </Button>
            <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <Link href="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15">
              <RotateCcw className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
            <button type="button" onClick={playErrorTone} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10">
              <Volume2 className="h-3.5 w-3.5" />
              Play alert tone
            </button>
            {referrer ? <span className="max-w-full truncate">Came from: {referrer}</span> : <span>No previous page detected.</span>}
          </div>
        </section>

        <section className="relative">
          <div className="absolute -inset-8 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-[0_32px_100px_rgba(0,0,0,0.36)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-bold uppercase text-blue-200">Pipnest route monitor</div>
                <div className="mt-1 font-mono text-sm text-slate-300">/unknown/path</div>
              </div>
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-200 ring-1 ring-red-400/25">Not found</span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="grid gap-2 font-mono text-sm">
                  <span className="text-slate-500">status.check()</span>
                  <span className="text-blue-300">route: unresolved</span>
                  <span className="text-amber-200">fallback: custom 404</span>
                  <span className="text-green-300">action: return available</span>
                </div>
                <div className="mt-6 h-28 rounded-md border border-dashed border-blue-400/30 bg-[linear-gradient(135deg,rgba(37,99,235,0.25),rgba(20,184,166,0.08))] p-4">
                  <div className="h-full rounded bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.14)_0,rgba(255,255,255,0.14)_1px,transparent_1px,transparent_18px)]" />
                </div>
              </div>

              <div className="grid content-between rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-300">Recovery path</div>
                  <div className="mt-4 grid gap-3">
                    {["Return", "Home", "Dashboard"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-md bg-white/5 p-3">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 text-xs font-black text-blue-100">{index + 1}</span>
                        <span className="text-sm font-semibold">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 rounded-md border border-blue-400/20 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100">
                  Tip: bookmark dashboard pages after login to avoid stale links.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

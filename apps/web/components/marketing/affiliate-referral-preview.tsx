"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getStoredAuthToken, useAuthStore } from "@/store/auth-store";

type AffiliateSummary = {
  referralCode: string;
  referralUrl: string;
};

const demoReferralUrl = "pipnestmarkets.com/auth/register?ref=YOURCODE";

export function AffiliateReferralPreview({ preview = false }: { preview?: boolean }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const token = useAuthStore((state) => state.token);
  const scope = useAuthStore((state) => state.scope);
  const [referralUrl, setReferralUrl] = useState(demoReferralUrl);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preview) return;
    hydrate("user");
  }, [hydrate, preview]);

  useEffect(() => {
    if (preview) return;
    const storedToken = scope === "user" && token ? token : getStoredAuthToken("user");
    if (!storedToken) {
      setReferralUrl(demoReferralUrl);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    apiFetch<AffiliateSummary>("/affiliate/me", { token: storedToken })
      .then((summary) => {
        if (active) setReferralUrl(summary.referralUrl || demoReferralUrl);
      })
      .catch(() => {
        if (active) setReferralUrl(demoReferralUrl);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [preview, scope, token]);

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const isDemo = referralUrl === demoReferralUrl;

  return (
    <div className="mt-5 rounded-md border border-white/10 bg-white/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{isDemo ? "Demo referral link" : "Your live referral link"}</p>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-blue-200" /> : null}
      </div>
      <div className="mt-2 flex min-w-0 items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-black text-white">{referralUrl}</p>
        {!isDemo ? (
          <button type="button" onClick={copyLink} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-blue-100 transition hover:bg-white/10" aria-label="Copy referral link">
            <Copy className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-semibold text-blue-100/80">
        {isDemo ? "Log in to display your real affiliate URL here." : copied ? "Copied." : "Share this URL to track referred traders."}
      </p>
    </div>
  );
}

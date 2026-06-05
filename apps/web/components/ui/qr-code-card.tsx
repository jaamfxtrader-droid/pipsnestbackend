"use client";

import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type QrCodeCardProps = {
  title: string;
  value: string;
  fileName?: string;
  shareText?: string;
  className?: string;
};

function qrUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(value)}`;
}

export function QrCodeCard({ title, value, fileName = "pipnest-qr.png", shareText, className }: QrCodeCardProps) {
  async function shareQrValue() {
    if (navigator.share) {
      await navigator.share({ title, text: shareText ?? title, url: value });
      return;
    }
    await navigator.clipboard.writeText(value);
  }

  if (!value) return null;

  return (
    <div className={className}>
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-center dark:border-white/10 dark:bg-slate-950">
        <div className="text-sm font-semibold">{title}</div>
        <img src={qrUrl(value)} alt={`${title} QR code`} className="mx-auto mt-3 h-44 w-44 rounded-md bg-white p-2" />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a
            href={qrUrl(value)}
            download={fileName}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
          <Button type="button" variant="secondary" className="h-9 px-3 text-xs" onClick={shareQrValue}>
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

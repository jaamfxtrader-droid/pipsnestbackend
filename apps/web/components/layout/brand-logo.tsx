import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

function PipnestMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={80}
      height={80}
      className={cn("h-8 w-8 object-contain", className)}
      priority
    />
  );
}

export function BrandLogo({
  compact = false,
  className,
  tone = "default"
}: {
  compact?: boolean;
  className?: string;
  tone?: "default" | "light";
}) {
  return (
    <Link href="/" aria-label="PipNest Markets home" className={cn("inline-flex items-center gap-2.5 font-semibold", className)}>
      <PipnestMark />
      {!compact ? (
        <span className="leading-none">
          <span className={cn("block text-[16px] font-black tracking-[0.12em]", tone === "light" ? "text-white" : "text-slate-950 dark:text-white")}>PIPNEST</span>
          <span className={cn("mt-1 block text-[8px] font-semibold tracking-[0.48em]", tone === "light" ? "text-slate-300" : "text-slate-500 dark:text-slate-300")}>MARKETS</span>
        </span>
      ) : null}
    </Link>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { ToastViewport } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
      <PwaRegister />
      <ToastViewport />
    </ThemeProvider>
  );
}

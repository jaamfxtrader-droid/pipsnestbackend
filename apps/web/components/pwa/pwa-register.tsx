"use client";

import { useEffect } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Window {
    __pipnestBeforeInstallPrompt?: BeforeInstallPromptEvent;
  }
}

export function PwaRegister() {
  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      window.__pipnestBeforeInstallPrompt = event as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("pipnest-beforeinstallprompt"));
    }

    function handleInstalled() {
      window.__pipnestBeforeInstallPrompt = undefined;
      window.localStorage.setItem("pipnest:pwa-installed", "1");
      window.dispatchEvent(new Event("pipnest-appinstalled"));
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleInstalled);
      };
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => registration.update().catch(() => undefined))
        .catch(() => undefined);
    };

    register();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  return null;
}

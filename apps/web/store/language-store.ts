"use client";

import { create } from "zustand";
import { getLanguage, type LanguageCode } from "@/lib/i18n";

type LanguageState = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
};

function getInitialLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("pipnest_language") as LanguageCode | null;
  return stored ? getLanguage(stored).code : "en";
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pipnest_language", language);
      const selected = getLanguage(language);
      document.documentElement.lang = selected.code;
      document.documentElement.dir = selected.dir;
    }
    set({ language });
  }
}));

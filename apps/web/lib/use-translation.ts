"use client";

import { useEffect } from "react";
import { getLanguage, translate, translateText, type TranslationKey } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language-store";

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const selected = getLanguage(language);

  useEffect(() => {
    document.documentElement.lang = selected.code;
    document.documentElement.dir = selected.dir;
  }, [selected.code, selected.dir]);

  return {
    language,
    selected,
    setLanguage,
    t: (key: TranslationKey) => translate(language, key),
    tx: (text: string) => translateText(language, text)
  };
}

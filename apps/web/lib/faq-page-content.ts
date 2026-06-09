import { faqItems as defaultFaqItemsFromContent } from "@/lib/legal-content";

export type CmsFaqItem = {
  id: string;
  question: string;
  answer: string;
  bullets: string[];
  visible?: boolean;
};

export const defaultCmsFaqItems: CmsFaqItem[] = defaultFaqItemsFromContent.map((item, index) => ({
  id: `faq-${index + 1}`,
  question: item.question,
  answer: item.answer?.join("\n\n") ?? "",
  bullets: item.bullets ?? [],
  visible: true
}));

function normalizeFaqItem(value: unknown, index: number): CmsFaqItem {
  const fallback = defaultCmsFaqItems[index] ?? {
    id: `faq-${index + 1}`,
    question: "New question",
    answer: "Add the answer here.",
    bullets: [],
    visible: true
  };
  const item = typeof value === "object" && value ? (value as Record<string, any>) : {};
  const answer = Array.isArray(item.answer) ? item.answer.join("\n\n") : String(item.answer ?? fallback.answer);
  const bullets = Array.isArray(item.bullets) ? item.bullets.map(String) : fallback.bullets;

  return {
    ...fallback,
    id: String(item.id ?? fallback.id),
    question: String(item.question ?? fallback.question),
    answer,
    bullets,
    visible: item.visible !== false
  };
}

export function parseFaqItems(metadata?: Record<string, any> | null): CmsFaqItem[] {
  if (!Array.isArray(metadata?.faqItems)) return defaultCmsFaqItems;
  return metadata.faqItems.map(normalizeFaqItem);
}

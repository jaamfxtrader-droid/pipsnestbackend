import { Mail, MapPin, MessageSquare } from "lucide-react";
import { PublicContactForm } from "@/components/forms/public-contact-form";
import { getCmsPage, getCmsSection } from "@/lib/cms";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Contact PipNest Markets support for funded trader challenge questions, account help, payouts, KYC, billing, and platform assistance.",
  path: "/contact",
  keywords: ["PipNest Markets contact", "trader support", "prop firm support"]
});

export default async function ContactPage() {
  const page = await getCmsPage("contact");
  const intro = getCmsSection(page, "intro");
  const formSection = getCmsSection(page, "form");

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <p className="font-semibold text-primary">{intro?.eyebrow ?? "Contact Us"}</p>
        <h1 className="mt-3 text-4xl font-semibold">{intro?.title ?? page?.title}</h1>
        <p className="mt-5 leading-8 text-slate-600 dark:text-slate-400">
          {intro?.content ?? page?.content}
        </p>
        <div className="mt-8 grid gap-4 text-sm">
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> contact@pipnestmarkets.com</div>
          <div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-primary" /> Dashboard ticket support</div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Remote fintech operations</div>
        </div>
      </div>
      <PublicContactForm title={formSection?.title} content={formSection?.content} />
    </main>
  );
}

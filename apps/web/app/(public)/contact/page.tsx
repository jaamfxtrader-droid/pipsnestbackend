import { Mail, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCmsPage, getCmsSection } from "@/lib/cms";

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
          <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> support@pipnestfunding.com</div>
          <div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-primary" /> Dashboard ticket support</div>
          <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Remote fintech operations</div>
        </div>
      </div>
      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
        <div>
          <h2 className="font-semibold">{formSection?.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formSection?.content}</p>
        </div>
        <Input placeholder="Full name" />
        <Input placeholder="Email address" />
        <Input placeholder="Subject" />
        <textarea className="min-h-36 rounded-md border border-slate-300/30 bg-white p-3 text-sm text-slate-950 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-white/10 dark:text-white" placeholder="Message" />
        <Button type="button">Send Message</Button>
      </form>
    </main>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULTS = [
  {
    question: "Is Elfo Innovations a registered business?",
    answer:
      "Yes. Elfo Innovations operates as a registered sole proprietorship in Pakistan, registered with the Federal Board of Revenue (FBR). As a sole proprietorship, it is registered with FBR rather than SECP — SECP registration applies only to incorporated companies (Private Limited, Single Member Company, etc.), not to sole proprietorships.",
  },
  {
    question: "How does the 'pay after you see it' model work?",
    answer:
      "We design and build the core deliverables first. You review a live preview and only pay once you're satisfied with what you see.",
  },
  {
    question: "What's included in your enterprise-grade delivery?",
    answer:
      "Every project ships through four supervised stages — Frontend, Backend, Database, and Hosting — with admin review, security checks, and staged client approval.",
  },
  {
    question: "How long does a typical project take?",
    answer:
      "Simple websites ship in 1–2 weeks. Business platforms typically take 4–8 weeks. Enterprise programs run on custom timelines.",
  },
  {
    question: "Do you offer post-launch support?",
    answer:
      "Yes. We offer monitoring, maintenance and priority support plans for every product we deliver.",
  },
  {
    question: "What services does Elfo Innovations offer?",
    answer:
      "We build with Laravel, ASP.NET, WordPress, and Shopify, and pair development with SEO and digital marketing so your site is built to be found, not just built.",
  },
  {
    question: "Do you sign a contract before starting a project?",
    answer:
      "Yes. Every engagement starts with a clear agreement covering scope, timeline, and payment terms, so both sides know exactly what's expected.",
  },
  {
    question: "How do you handle payments?",
    answer:
      "Projects are typically milestone-based — an initial commitment to start, with the balance tied to agreed milestones or final delivery, depending on the project.",
  },
  {
    question: "Can you redesign or migrate an existing website?",
    answer:
      "Yes. We work with existing sites — redesigns, platform migrations (e.g. moving from WordPress to a custom build), and performance or SEO overhauls.",
  },
  {
    question: "Do you provide hosting and domain setup?",
    answer:
      "Yes, we can handle hosting and domain setup as part of delivery, or work within your existing hosting environment if you already have one.",
  },
  {
    question: "What is your project process?",
    answer:
      "Discovery and requirements first, then design, development, staged review with the client, and launch — followed by optional ongoing support.",
  },
  {
    question: "Do you work with clients outside Pakistan?",
    answer:
      "Yes. Alongside local Karachi businesses, we work with international clients and are set up to handle remote projects end-to-end.",
  },
  {
    question: "Why should I choose Elfo Innovations over other agencies?",
    answer:
      "We keep teams small and communication direct — you deal with the people actually building your project, not account managers. Combined with our staged 'pay after you see it' approach, you get transparency most agencies don't offer.",
  },
  {
    question: "What makes your development process different?",
    answer:
      "Every project goes through supervised stages — Frontend, Backend, Database, and Hosting — with review at each step, rather than one big handoff at the end. This catches issues early and keeps you involved throughout, not just at kickoff and delivery.",
  },
];

export function FaqSection() {
  const [showAll, setShowAll] = useState(false);
  const VISIBLE_COUNT = 6;
  const { data, isPending } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () =>
      (await supabase.from("faqs").select("*").eq("is_active", true).order("sort_order")).data,
  });
  const items = (data && data.length > 0 ? data : DEFAULTS) as any[];
  const visibleItems = showAll ? items : items.slice(0, VISIBLE_COUNT);
  const hasMore = items.length > VISIBLE_COUNT;

  return (
    <section id="faq" className="border-t bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
            FAQ
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Questions, <span className="electric-text">answered.</span>
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl border-0 px-5 py-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              ))
            : visibleItems.map((f, i) => (
            <AccordionItem
              key={f.id ?? i}
              value={`i${i}`}
              className="glass-card rounded-2xl border-0 px-5"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                {f.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {!isPending && hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAll((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-accent/40"
            >
              {showAll ? "Show less" : `View all ${items.length} questions`}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
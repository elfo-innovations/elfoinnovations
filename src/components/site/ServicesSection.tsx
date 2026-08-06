import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Code2, Smartphone, Cloud, Building2, ShoppingBag, Puzzle,
  Palette, Database, Server, LifeBuoy, ArrowUpRight,
} from "lucide-react";
import { useInquiry } from "@/hooks/use-inquiry";

const DEFAULTS = [
  { title: "Web Development", description: "High-performance websites and platforms built with modern stacks.", icon: "Code2" },
  { title: "Mobile App Development", description: "Native and cross-platform mobile apps for iOS and Android.", icon: "Smartphone" },
  { title: "Cloud Solutions", description: "Scalable cloud infrastructure, DevOps, and serverless architectures.", icon: "Cloud" },
  { title: "Enterprise Solutions", description: "Custom enterprise software that fits your organization exactly.", icon: "Building2" },
  { title: "E-Commerce Development", description: "High-converting online stores with payments and inventory.", icon: "ShoppingBag" },
  { title: "Custom Software", description: "Bespoke software engineered around your unique workflows.", icon: "Puzzle" },
  { title: "UI/UX Design", description: "Premium, conversion-focused interfaces users love.", icon: "Palette" },
  { title: "API & Database Development", description: "Robust APIs and well-modeled databases at any scale.", icon: "Database" },
  { title: "Hosting & Deployment", description: "Reliable, secure hosting with CI/CD pipelines.", icon: "Server" },
  { title: "Maintenance & Support", description: "Ongoing monitoring, updates, and 24/7 support.", icon: "LifeBuoy" },
];

const ICONS: Record<string, any> = { Code2, Smartphone, Cloud, Building2, ShoppingBag, Puzzle, Palette, Database, Server, LifeBuoy };

export function ServicesSection() {
  const { open } = useInquiry();
  const { data } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").eq("is_active", true).order("sort_order")).data,
  });
  const items = (data && data.length > 0 ? data : DEFAULTS) as any[];

  return (
    <section id="services" className="border-t bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">Services</div>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Everything you need to <span className="electric-text">ship software</span></h2>
          </div>
          <button onClick={open} className="text-sm font-semibold text-primary hover:underline">Discuss your project →</button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((s, i) => {
            const Icon = ICONS[s.icon] || Code2;
            return (
              <div key={s.id ?? i} onClick={open} className="glass-card group cursor-pointer rounded-2xl p-6 transition-all hover:-translate-y-1 hover:electric-glow">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Target, Eye, Zap, ExternalLink, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFollowUs } from "@/hooks/use-follow-us";
import { BecomeDeveloperButton } from "@/components/recruitment/DeveloperApplicationModal";


export function AboutSection() {
  const { open: openFollow } = useFollowUs();
  const { data } = useQuery({
    queryKey: ["about_content"],
    queryFn: async () => (await supabase.from("about_content").select("*").maybeSingle()).data,
  });
  const a: any = data || {};
  const why: { title: string; description: string }[] = a.why_us || [];
  return (
    <section id="about" className="border-t bg-background py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <div className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs font-medium">{a.eyebrow || "About ELFO"}</div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{a.title}</h2>
          <p className="mt-5 text-muted-foreground">{a.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={openFollow} variant="outline" className="rounded-full">
              <Heart className="mr-2 h-4 w-4 text-primary" /> Follow Us
            </Button>
            <BecomeDeveloperButton />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="glass-card rounded-2xl p-5">
              <Target className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">Our Mission</div>
              <p className="mt-1 text-xs text-muted-foreground">{a.mission}</p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <Eye className="h-5 w-5 text-primary" />
              <div className="mt-3 text-sm font-semibold">Our Vision</div>
              <p className="mt-1 text-xs text-muted-foreground">{a.vision}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {why.map((f, i) => (
            <div key={i} className="glass-card flex items-start gap-4 rounded-2xl p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {i === why.length - 1 ? <Zap className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div>
                <div className="font-semibold">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Portfolios */}
      <div className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card overflow-hidden rounded-3xl">
          <div className="grid gap-0 md:grid-cols-[1.1fr_2fr]">
            <div className="relative flex flex-col justify-center gap-3 p-8 sm:p-10">
              <div className="absolute inset-0 opacity-40 circuit-pattern" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Founder portfolio
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold sm:text-3xl">
                  Meet the builder behind <span className="electric-text">ELFO</span>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  An engineer with a live portfolio. Every project shipped, deployed and open on the web.
                </p>
              </div>
            </div>
            <div className="grid gap-4 border-t p-6 sm:p-8 md:border-l md:border-t-0">
              {[
                { name: "Aaban Syed", url: "https://aabansyed.netlify.app", role: "Full-Stack Engineer", host: "aabansyed.netlify.app" },
              ].map((p) => (

                <a key={p.url} href={p.url} target="_blank" rel="noreferrer"
                  className="group relative flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:electric-glow">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{p.role}</div>
                    <div className="mt-2 font-display text-lg font-semibold">{p.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{p.host}</div>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Visit portfolio
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

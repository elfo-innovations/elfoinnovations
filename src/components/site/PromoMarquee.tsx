import { Sparkles } from "lucide-react";

export function PromoMarquee({ text, theme, enabled }: { text: string; theme: "light" | "dark"; enabled: boolean }) {
  if (!enabled || !text?.trim()) return null;
  const isDark = theme === "dark";

  return (
    <div className={`w-full overflow-hidden border-b py-2 ${isDark ? "border-white/10 bg-[#0a1128] text-white" : "border-black/10 bg-primary text-primary-foreground"}`}>
      <div className="promo-marquee-track flex w-max whitespace-nowrap">
        {Array.from({ length: 2 }).map((_, dup) => (
          <div key={dup} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={dup === 1}>
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-80" /> {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
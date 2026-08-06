import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ElfoLogo } from "@/components/brand/Logo";
import { Instagram, Linkedin, Github, Facebook, ChevronRight, MessageCircle } from "lucide-react";

type Item = {
  key: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
};

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21l-6.52 7.45L22.5 22h-6.79l-4.77-6.24L5.2 22H2.44l7.03-8.03L1.5 2h6.94l4.3 5.68L18.244 2Zm-2.38 18h1.86L7.24 4H5.27l10.594 16Z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.968-3.898-5.994-8.31-6.026-2.912.022-5.114.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.05 7.155 1.427 1.781 3.628 2.695 6.54 2.717 2.628-.02 4.365-.63 5.808-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.625-1.759-.192 1.348-.63 2.44-1.315 3.254-.919 1.093-2.216 1.689-3.855 1.77-1.24.062-2.433-.24-3.354-.85-1.088-.723-1.726-1.83-1.796-3.116-.146-2.681 1.958-4.7 5.303-4.9.892-.055 1.712.032 2.464.176-.129-1.246-1.024-1.926-2.457-1.955-1.135.017-1.995.427-2.548 1.212L8.194 7.9c1.036-1.402 2.632-2.173 4.612-2.201h.045c2.999.021 4.79 1.828 4.99 4.988.135.089.269.181.4.276 1.31.978 2.147 2.34 2.372 3.834.353 2.362-.564 4.876-2.606 6.876C15.985 23.24 14.017 23.98 12.186 24Z" />
  </svg>
);

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.86a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1.84-.24Z"/>
  </svg>
);

const items: Item[] = [
  { key: "ig", label: "Instagram", href: "https://www.instagram.com/elfo_innovations/", icon: <Instagram className="h-5 w-5" />, accent: "from-pink-500 to-orange-400" },
  { key: "tt", label: "TikTok", href: "https://www.tiktok.com/@elfo.innovations", icon: <TikTokIcon />, accent: "from-cyan-400 to-pink-500" },
  { key: "li", label: "LinkedIn", href: "https://www.linkedin.com/company/elfo-innovations", icon: <Linkedin className="h-5 w-5" />, accent: "from-sky-500 to-blue-600" },
  { key: "gh", label: "GitHub", href: "https://github.com/elfo-innovations", icon: <Github className="h-5 w-5" />, accent: "from-zinc-400 to-zinc-700" },
  { key: "fb", label: "Facebook", href: "https://www.facebook.com/people/Elfo-Innovations/61587440560896/", icon: <Facebook className="h-5 w-5" />, accent: "from-blue-500 to-blue-700" },
  { key: "x", label: "X (Twitter)", href: "https://x.com/elfoInnovations", icon: <XIcon />, accent: "from-zinc-500 to-black" },
  { key: "th", label: "Threads", href: "https://www.threads.com/@elfo_innovations", icon: <ThreadsIcon />, accent: "from-zinc-500 to-black" },
  { key: "wa-us", label: "US Office (WhatsApp)", sub: "+1 (605) 902-6927", href: "https://wa.me/16059026927", icon: <span className="text-lg" aria-hidden>🇺🇸</span>, accent: "from-green-500 to-emerald-600" },
  { key: "wa-pk", label: "Pakistan Office (WhatsApp)", sub: "+92 321 1971669", href: "https://wa.me/923211971669", icon: <span className="text-lg" aria-hidden>🇵🇰</span>, accent: "from-green-500 to-emerald-600" },
];

export function FollowUsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-primary/20 bg-background/80 p-0 backdrop-blur-2xl sm:max-w-lg">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col items-center px-6 pt-8 pb-4 text-center">
            <ElfoLogo className="h-10 sm:h-12" />
            <DialogTitle className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">
              Follow Elfo Innovations
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Connect. Collaborate. Create.
            </DialogDescription>
          </div>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 pb-6 sm:px-6">
            {items.map((it) => (
              <a
                key={it.key}
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={it.label}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3 backdrop-blur transition-all hover:border-primary/50 hover:bg-card/70 hover:shadow-[0_0_25px_-8px_hsl(var(--primary)/0.5)]"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${it.accent} text-white shadow-sm`}>
                  {it.icon}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-semibold">{it.label}</span>
                  {it.sub && <span className="block truncate text-xs text-primary">{it.sub}</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </a>
            ))}
          </div>

          <div className="border-t border-border/50 px-6 py-3 text-center text-[11px] uppercase tracking-widest text-primary/80">
            Solutions Today, Success Tomorrow
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FollowUsTriggerIcon() {
  return <MessageCircle className="h-4 w-4" />;
}

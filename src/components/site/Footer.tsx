import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ElfoLogo } from "@/components/brand/Logo";
import { Instagram, Linkedin, Github, Facebook, MessageCircle } from "lucide-react";

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2H21l-6.52 7.45L22.5 22h-6.79l-4.77-6.24L5.2 22H2.44l7.03-8.03L1.5 2h6.94l4.3 5.68L18.244 2Zm-2.38 18h1.86L7.24 4H5.27l10.594 16Z" />
  </svg>
);
const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.968-3.898-5.994-8.31-6.026-2.912.022-5.114.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.05 7.155 1.427 1.781 3.628 2.695 6.54 2.717 2.628-.02 4.365-.63 5.808-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.625-1.759-.192 1.348-.63 2.44-1.315 3.254-.919 1.093-2.216 1.689-3.855 1.77-1.24.062-2.433-.24-3.354-.85-1.088-.723-1.726-1.83-1.796-3.116-.146-2.681 1.958-4.7 5.303-4.9.892-.055 1.712.032 2.464.176-.129-1.246-1.024-1.926-2.457-1.955-1.135.017-1.995.427-2.548 1.212L8.194 7.9c1.036-1.402 2.632-2.173 4.612-2.201h.045c2.999.021 4.79 1.828 4.99 4.988.135.089.269.181.4.276 1.31.978 2.147 2.34 2.372 3.834.353 2.362-.564 4.876-2.606 6.876C15.985 23.24 14.017 23.98 12.186 24Z" />
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.86a8.16 8.16 0 0 0 4.77 1.52V6.93a4.85 4.85 0 0 1-1.84-.24Z"/>
  </svg>
);

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/elfo_innovations/", icon: <Instagram className="h-4 w-4" /> },
  { label: "TikTok", href: "https://www.tiktok.com/@elfo.innovations", icon: <TikTokIcon /> },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/elfo-innovations", icon: <Linkedin className="h-4 w-4" /> },
  { label: "GitHub", href: "https://github.com/elfo-innovations", icon: <Github className="h-4 w-4" /> },
  { label: "Facebook", href: "https://www.facebook.com/people/Elfo-Innovations/61587440560896/", icon: <Facebook className="h-4 w-4" /> },
  { label: "X (Twitter)", href: "https://x.com/elfoInnovations", icon: <XIcon /> },
  { label: "Threads", href: "https://www.threads.com/@elfo_innovations", icon: <ThreadsIcon /> },
];

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <ElfoLogo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <div className="mt-6">
            <h4 className="text-sm font-semibold">Follow Us</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="https://wa.me/16059026927" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" /> <span aria-hidden>🇺🇸</span> US Office
              </a>
              <a href="https://wa.me/923211971669" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary">
                <MessageCircle className="h-3.5 w-3.5" /> <span aria-hidden>🇵🇰</span> Pakistan Office
              </a>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.company")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">{t("footer.about")}</Link></li>
            <li><Link to="/services" className="hover:text-foreground">{t("footer.services")}</Link></li>
            <li><Link to="/portfolio" className="hover:text-foreground">{t("footer.portfolio")}</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">{t("footer.pricing")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.account")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">{t("footer.signin")}</Link></li>
            <li><Link to="/client" className="hover:text-foreground">{t("footer.clientPortal")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} ELFO INNOVATIONS. {t("footer.rights")}</span>
          <span>{t("footer.builtWith")}</span>
        </div>
      </div>
    </footer>
  );
}

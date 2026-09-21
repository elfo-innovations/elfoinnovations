import { useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ElfoLogo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useInquiry } from "@/hooks/use-inquiry";
import { subscribeSlideTheme, getSlideThemeColor } from "@/lib/slide-theme";
// ...
import { useAuth } from "@/hooks/use-auth";
// phir toggle button ko: {!colorLocked && <button>...</button>} me wrap kar dunga

const NAV_KEY_BY_HREF: Record<string, string> = {
  "/services": "nav.services",
  "/portfolio": "nav.portfolio",
  "/pricing": "nav.pricing",
  "/blogs": "nav.blog",
  "/about": "nav.about",
  "/contact": "nav.contact",
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { open: openInquiry } = useInquiry();
  const slideColor = useSyncExternalStore(subscribeSlideTheme, getSlideThemeColor, () => null);
  const tinted = !!slideColor;

  const { user, roles } = useAuth();
  const { t } = useTranslation();
  const dashHref = roles.includes("admin")
    ? "/admin"
    : roles.includes("developer")
      ? "/developer"
      : "/client";

  const { data } = useQuery({
    queryKey: ["nav_links"],
    queryFn: async () =>
      (await supabase.from("nav_links").select("*").eq("is_enabled", true).order("sort_order"))
        .data,
  });

  const FALLBACK = [
    { id: "s", label: t("nav.services"), href: "/services" },
    { id: "p", label: t("nav.portfolio"), href: "/portfolio" },
    { id: "pr", label: t("nav.pricing"), href: "/pricing" },
    { id: "b", label: t("nav.blog"), href: "/blogs" },
    { id: "a", label: t("nav.about"), href: "/about" },
  ];
  const links = data && data.length > 0 ? data : FALLBACK;
  const labelFor = (l: { href: string; label: string }) => {
    const key = NAV_KEY_BY_HREF[l.href];
    return key ? t(key, { defaultValue: l.label }) : l.label;
  };

  return (
    <header className="sticky top-5 z-40 px-4 sm:px-6">
      <div
        style={{
          transition: "background-color 500ms ease, border-color 500ms ease",
          ...(tinted ? { backgroundColor: slideColor as string } : {}),
        }}
        className={`mx-auto flex h-[72px] max-w-6xl items-center justify-between rounded-[28px] px-4 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:px-6 ${
          tinted
            ? "border border-white/20 shadow-lg"
            : "border border-border/60 bg-background/85 dark:border-white/10 dark:bg-background/70 dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5"
        }`}
      >
        <Link to="/" className="flex shrink-0 items-center pl-1">
          <ElfoLogo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.id}
              to={l.href}
              className={`text-sm font-medium transition-colors ${tinted ? "text-white/90 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              {labelFor(l)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />

          {user ? (
            <Link to={dashHref}>
              <Button
                variant="ghost"
                className={`rounded-full px-5 ${tinted ? "text-white hover:bg-white/15 hover:text-white" : ""}`}
              >
                {t("nav.dashboard")}
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                variant="ghost"
                className={`rounded-full px-5 ${tinted ? "text-white hover:bg-white/15 hover:text-white" : ""}`}
              >
                {t("nav.signin")}
              </Button>
            </Link>
          )}
          <Button
            onClick={openInquiry}
            className={`rounded-full px-6 ${tinted ? "bg-white text-foreground shadow-lg hover:bg-white/90" : "electric-glow"}`}
          >
            {t("nav.getStarted")}
          </Button>
        </div>
        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${tinted ? "text-white hover:bg-white/15 hover:text-white" : ""}`}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="mx-auto mt-3 max-w-6xl rounded-[28px] border border-border/60 bg-background/95 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-background/90 dark:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.6)] dark:ring-1 dark:ring-white/5 md:hidden">
          <div className="space-y-1.5 px-5 py-5">
            {links.map((l) => (
              <Link
                key={l.id}
                to={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {labelFor(l)}
              </Link>
            ))}

            {user ? (
              <Link
                to={dashHref}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {t("nav.signin")}
              </Link>
            )}
            <Button
              onClick={() => {
                setOpen(false);
                openInquiry();
              }}
              className="mt-3 w-full rounded-full"
            >
              {t("nav.getStarted")}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

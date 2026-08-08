import { useState } from "react";
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

import { useAuth } from "@/hooks/use-auth";

const NAV_KEY_BY_HREF: Record<string, string> = {
  "/services": "nav.services",
  "/portfolio": "nav.portfolio",
  "/pricing": "nav.pricing",
  "/blog": "nav.blog",
  "/about": "nav.about",
  "/contact": "nav.contact",
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { open: openInquiry } = useInquiry();
  
  const { user, roles } = useAuth();
  const { t } = useTranslation();
  const dashHref = roles.includes("admin") ? "/admin" : roles.includes("developer") ? "/developer" : "/client";

  const { data } = useQuery({
    queryKey: ["nav_links"],
    queryFn: async () => (await supabase.from("nav_links").select("*").eq("is_enabled", true).order("sort_order")).data,
  });

  const FALLBACK = [
    { id: "s", label: t("nav.services"), href: "/services" },
    { id: "p", label: t("nav.portfolio"), href: "/portfolio" },
    { id: "pr", label: t("nav.pricing"), href: "/pricing" },
    { id: "b", label: t("nav.blog"), href: "/blog" },
    { id: "a", label: t("nav.about"), href: "/about" },
  ];
  const links = (data && data.length > 0 ? data : FALLBACK) as any[];
  const labelFor = (l: any) => {
    const key = NAV_KEY_BY_HREF[l.href];
    return key ? t(key, { defaultValue: l.label }) : l.label;
  };

  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-border/60 bg-background/80 px-3 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-4">
        <Link to="/" className="flex shrink-0 items-center pl-1"><ElfoLogo /></Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.id} to={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{labelFor(l)}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1.5 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />

          {user ? (
            <Link to={dashHref}><Button variant="ghost" className="rounded-full">{t("nav.dashboard")}</Button></Link>
          ) : (
            <Link to="/auth"><Button variant="ghost" className="rounded-full">{t("nav.signin")}</Button></Link>
          )}
          <Button onClick={openInquiry} className="rounded-full electric-glow">{t("nav.getStarted")}</Button>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full" aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</Button>
        </div>
      </div>
      {open && (
        <div className="mx-auto mt-2 max-w-5xl rounded-3xl border border-border/60 bg-background/95 shadow-lg shadow-black/5 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            {links.map((l) => (
              <Link key={l.id} to={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">{labelFor(l)}</Link>
            ))}

            {user ? (
              <Link to={dashHref} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.dashboard")}</Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.signin")}</Link>
            )}
            <Button onClick={() => { setOpen(false); openInquiry(); }} className="mt-2 w-full rounded-full">{t("nav.getStarted")}</Button>
          </div>
        </div>
      )}
    </header>
  );
}

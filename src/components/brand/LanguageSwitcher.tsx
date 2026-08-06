import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, changeLanguage, type LangCode, type LangScope, scopeFromPath, getScopedLang } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false, scope }: { compact?: boolean; scope?: LangScope }) {
  const activeScope: LangScope = scope ?? (typeof window !== "undefined" ? scopeFromPath(window.location.pathname) : "public");
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentCode = (typeof window !== "undefined" ? getScopedLang(activeScope) : (i18n.language as LangCode));
  const current = LANGUAGES.find((l) => l.code === currentCode) ?? LANGUAGES[0];

  const select = async (code: LangCode) => {
    setOpen(false);
    await changeLanguage(activeScope, code);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.language", "Language")}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs font-medium transition-all hover:border-primary/60 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3",
            compact && "px-2 sm:px-2"
          )}
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">{current.native}</span>
          <span className="sm:hidden">{current.flag}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[100] w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border/60 bg-popover p-0 text-popover-foreground shadow-xl"
      >
        <ul role="listbox" className="max-h-[min(20rem,60vh)] overflow-y-auto py-1">
          {LANGUAGES.map((lng) => {
            const active = lng.code === current.code;
            return (
              <li key={lng.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => select(lng.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent",
                    active && "bg-primary/10 text-primary"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-base leading-none">{lng.flag}</span>
                    <span className="truncate font-medium">{lng.native}</span>
                    <span className="hidden text-[10px] text-muted-foreground xs:inline">{lng.label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

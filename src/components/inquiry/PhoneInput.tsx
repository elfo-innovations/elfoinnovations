import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PhoneValue = { country: Country; local: string; full: string; valid: boolean };

export function PhoneInput({
  value,
  onChange,
  error,
}: {
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  error?: string;
}) {
  const [openC, setOpenC] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q));
  }, [query]);

  const setCountry = (c: Country) => {
    const valid = value.local.length >= c.minLen && value.local.length <= c.maxLen;
    onChange({ country: c, local: value.local, full: `${c.dial}${value.local}`, valid });
    setOpenC(false);
  };

  const setLocal = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, value.country.maxLen);
    const valid = digits.length >= value.country.minLen && digits.length <= value.country.maxLen;
    onChange({ country: value.country, local: digits, full: `${value.country.dial}${digits}`, valid });
  };

  return (
    <div className="w-full">
      <div className={cn("flex items-stretch overflow-hidden rounded-xl border bg-background", error && "border-destructive")}>
        <Popover open={openC} onOpenChange={setOpenC}>
          <PopoverTrigger asChild>
            <button type="button" className="flex shrink-0 items-center gap-2 border-r px-3 py-3 text-sm font-medium hover:bg-accent">
              <span className="text-base leading-none">{value.country.flag}</span>
              <span>{value.country.dial}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 opacity-60" />
              <input
                autoFocus
                placeholder="Search country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-muted-foreground">{c.dial}</span>
                  {c.code === value.country.code && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          inputMode="numeric"
          placeholder="Phone number"
          value={value.local}
          onChange={(e) => setLocal(e.target.value)}
          className="border-0 focus-visible:ring-0"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      {!error && value.local.length > 0 && !value.valid && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Enter a valid {value.country.name} number ({value.country.minLen === value.country.maxLen ? value.country.minLen : `${value.country.minLen}–${value.country.maxLen}`} digits after {value.country.dial}).
        </p>
      )}
    </div>
  );
}

export const defaultPhone = (): PhoneValue => ({ country: COUNTRIES[0], local: "", full: "", valid: false });

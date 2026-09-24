import { cn } from "@/lib/utils";

export function categoryItemClass(isActive: boolean) {
  return cn(
    "flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-2xl border px-4 py-3 text-sm font-medium transition lg:whitespace-normal",
    isActive
      ? "border-primary/25 bg-card text-foreground shadow-sm"
      : "border-transparent bg-card/40 text-muted-foreground hover:bg-card/70 hover:text-foreground",
  );
}

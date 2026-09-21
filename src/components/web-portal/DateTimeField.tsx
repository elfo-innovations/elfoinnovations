import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/**
 * Calendar + time picker for scheduling fields (offer start/end,
 * banner start/end, etc). Replaces the raw <input type="datetime-local">,
 * which on some browsers registers a single click as several steps on the
 * spinner and has no way to block past dates or jump years cleanly.
 *
 * value / onChange use ISO strings (same contract the old Field had), so
 * this drops in wherever `start_at`/`end_at`/`start_date`/`end_date` were
 * wired to `type="datetime-local"`.
 */
export function DateTimeField({
  label,
  value,
  onChange,
  disablePast = true,
}: {
  label: string;
  value?: string | null;
  onChange: (iso: string | null) => void;
  disablePast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const timeValue = date
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : "12:00";

  const commit = (nextDate: Date | undefined, nextTime: string) => {
    if (!nextDate) return onChange(null);
    const [h, m] = nextTime.split(":").map(Number);
    const combined = new Date(nextDate);
    combined.setHours(h || 0, m || 0, 0, 0);
    onChange(combined.toISOString());
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxYear = new Date();
  maxYear.setFullYear(maxYear.getFullYear() + 5);

  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 justify-start gap-2 font-normal"
            >
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {date ? (
                date.toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              ) : (
                <span className="text-muted-foreground">Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                commit(d, timeValue);
                setOpen(false);
              }}
              disabled={disablePast ? { before: today } : undefined}
              captionLayout="dropdown"
              startMonth={today}
              endMonth={maxYear}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => commit(date ?? new Date(), e.target.value)}
          className="h-10 w-28 shrink-0"
          disabled={!date}
        />
        {date && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

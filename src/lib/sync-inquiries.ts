import { supabase } from "@/integrations/supabase/client";
import { listPending, markDone, markFailed } from "@/lib/offline-queue";

let syncing = false;

export async function syncOfflineInquiries(): Promise<{ synced: number; failed: number }> {
  if (syncing) return { synced: 0, failed: 0 };
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const pending = await listPending();
    for (const item of pending) {
      try {
        const p = item.payload as any;
        // Idempotency: reuse the queued id as the lead_code suffix so retries don't duplicate.
        const leadCode =
          p.lead_code || `ELFO-${item.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        const { error } = await supabase.from("leads").insert({ ...p, lead_code: leadCode });
        if (error) {
          // duplicate == already synced previously → treat as done
          if (/duplicate|unique|already/i.test(error.message)) {
            await markDone(item.id);
            synced++;
          } else {
            await markFailed(item.id, error.message);
            failed++;
          }
        } else {
          await markDone(item.id);
          synced++;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "unknown";
        await markFailed(item.id, message);
        failed++;
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failed };
}

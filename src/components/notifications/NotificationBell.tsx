import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  category: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, link, category, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notif[]);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          load();
          if (payload.eventType === "INSERT") {
            const n = payload.new as Notif;
            toast(n.title, { description: n.body ?? undefined });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAll = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    load();
  };

  const openItem = async (n: Notif) => {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link }).catch(() => (window.location.href = n.link!));
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] max-w-[90vw] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <button onClick={markAll} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary disabled:opacity-40" disabled={unread === 0}>
            <Check className="h-3 w-3" />Mark all read
          </button>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">No notifications yet.</div>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => openItem(n)}
              className={`flex w-full flex-col items-start gap-0.5 border-b px-3 py-2.5 text-left transition hover:bg-accent ${!n.read_at ? "bg-primary/5" : ""}`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="truncate text-xs font-semibold">{n.title}</div>
                {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              {n.body && <div className="line-clamp-2 text-[11px] text-muted-foreground">{n.body}</div>}
              <div className="text-[10px] text-muted-foreground/70">{new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

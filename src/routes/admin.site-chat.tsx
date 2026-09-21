import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bot, HelpCircle, RefreshCw, Trash2, User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site-chat")({
  head: () => ({ meta: [{ title: "Site Chat (Elsa) — Admin" }] }),
  component: AdminSiteChat,
});

type LogRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type Session = {
  sessionId: string;
  lastMessage: string;
  lastAt: string;
  messageCount: number;
};

function AdminSiteChat() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin-site-chat-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_chat_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
    refetchInterval: 30000, // pick up new conversations without a manual refresh
  });

  // Group the flat log table into one row per session, newest activity first
  const sessions: Session[] = useMemo(() => {
    const byId = new Map<string, LogRow[]>();
    for (const row of data ?? []) {
      const list = byId.get(row.session_id) ?? [];
      list.push(row);
      byId.set(row.session_id, list);
    }
    return Array.from(byId.entries())
      .map(([sessionId, rows]) => {
        const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
        const last = sorted[sorted.length - 1];
        return {
          sessionId,
          lastMessage: last?.content ?? "",
          lastAt: last?.created_at ?? "",
          messageCount: sorted.length,
        };
      })
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  }, [data]);

  const thread = useMemo(() => {
    if (!selected) return [];
    return (data ?? [])
      .filter((r) => r.session_id === selected)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }, [data, selected]);

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this entire conversation? This can't be undone.")) return;
    const { error } = await supabase.from("site_chat_logs").delete().eq("session_id", sessionId);
    if (error) return toast.error(error.message);
    toast.success("Conversation deleted");
    if (selected === sessionId) setSelected(null);
    refetch();
  };

  return (
    <DashboardShell role="admin">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Site Chat — Elsa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every conversation visitors have with the website chatbot. Elsa's FAQ answers are managed separately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Link to="/admin/web-portal" search={{ tab: "faq" }}>
            <Button size="sm">
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Edit FAQs
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="glass-card max-h-[70vh] overflow-y-auto rounded-2xl">
          {sessions.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
          )}
          {sessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => setSelected(s.sessionId)}
              className={`block w-full border-b px-4 py-3 text-left transition hover:bg-accent/40 ${
                selected === s.sessionId ? "bg-accent/60" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-primary">{s.sessionId.slice(0, 8)}…</span>
                <span className="text-[11px] text-muted-foreground">
                  {s.lastAt ? format(new Date(s.lastAt), "MMM d, h:mm a") : ""}
                </span>
              </div>
              <div className="mt-1 truncate text-sm text-foreground">{s.lastMessage}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{s.messageCount} messages</div>
            </button>
          ))}
        </div>

        {/* Selected thread */}
        <div className="glass-card flex max-h-[70vh] flex-col overflow-hidden rounded-2xl">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
              Select a conversation on the left to view the full thread.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">Session: {selected}</span>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteSession(selected)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.map((m) => (
                  <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div>
                      <div
                        className={`max-w-md rounded-2xl px-3.5 py-2 text-sm ${
                          m.role === "user"
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-muted text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                      <div className={`mt-0.5 text-[10px] text-muted-foreground ${m.role === "user" ? "text-right" : ""}`}>
                        {format(new Date(m.created_at), "MMM d, h:mm a")}
                      </div>
                    </div>
                    {m.role === "user" && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
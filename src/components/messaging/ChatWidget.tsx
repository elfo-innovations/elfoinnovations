import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X, Check, CheckCheck, Paperclip, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { translateMessage } from "@/lib/translate.functions";
import { getScopedLang, LANGUAGES, type LangCode } from "@/i18n";

type Role = "admin" | "developer" | "client";

type Conv = {
  id: string;
  subject: string | null;
  project_id: string | null;
  client_id: string;
  kind?: "client_admin" | "developer_admin";
  peer_name?: string;
  peer_role?: "client" | "developer";
  project_name?: string;
};

type Msg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
};

type Preview = { body: string; sender_role: string; created_at: string; unread: number } | null;

export function ChatWidget({ role }: { role: Role }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [preview, setPreview] = useState<Preview>(null);
  const [filter, setFilter] = useState<"all" | "clients" | "developers">("all");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const myLang: LangCode = useMemo(() => getScopedLang(role === "admin" ? "admin" : role === "developer" ? "developer" : "client"), [role]);
  // per-message translation cache: key = `${msg.id}:${targetLang}` → { translated, detected }
  const [translations, setTranslations] = useState<Record<string, { translated: string; detected: string }>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const translatingRef = useRef<Set<string>>(new Set());

  const loadPreview = async (convIds: string[]) => {
    if (!convIds.length || !user) { setPreview(null); return; }
    const { data } = await supabase
      .from("messages")
      .select("body, sender_role, created_at, sender_id, read_at, attachment_name")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as any[];
    const latest = rows[0];
    const unreadCount = rows.filter((m) => m.sender_id !== user.id && !m.read_at).length;
    if (!latest) { setPreview(null); setUnread(unreadCount); return; }
    setPreview({
      body: latest.body || (latest.attachment_name ? `📎 ${latest.attachment_name}` : ""),
      sender_role: latest.sender_role,
      created_at: latest.created_at,
      unread: unreadCount,
    });
    setUnread(unreadCount);
  };

  const loadConvs = async () => {
    let q = supabase
      .from("conversations")
      .select("id, subject, project_id, client_id, kind, developer_id, projects(name), clients(full_name), developers(full_name)")
      .order("updated_at", { ascending: false });
    if (role === "client") q = q.eq("kind", "client_admin");
    else if (role === "developer") q = q.eq("kind", "developer_admin");
    const { data: raw } = await q;
    const list: Conv[] = (raw ?? []).map((c: any) => ({
      id: c.id,
      subject: c.subject,
      project_id: c.project_id,
      client_id: c.client_id,
      kind: c.kind,
      project_name: c.projects?.name,
      peer_role: c.kind === "developer_admin" ? "developer" : "client",
      peer_name: c.kind === "developer_admin" ? c.developers?.full_name : c.clients?.full_name,
    }));
    setConvs(list);
    if (list.length && !active) setActive(list[0]);
    loadPreview(list.map((c) => c.id));
  };


  const loadMsgs = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    const msgs = (data ?? []) as Msg[];
    // fetch sender names
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.full_name || p.email]));
      msgs.forEach((m) => (m.sender_name = nameById.get(m.sender_id) || m.sender_role));
    }
    setMessages(msgs);
    // mark delivered + read for messages not from me
    const toMark = msgs.filter((m) => m.sender_id !== user?.id && !m.read_at).map((m) => m.id);
    if (toMark.length) {
      await supabase.from("messages").update({ read_at: new Date().toISOString(), delivered_at: new Date().toISOString() }).in("id", toMark);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConvs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!active) return;
    loadMsgs(active.id);
    const ch = supabase
      .channel(`msg-${active.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${active.id}` }, () => {
        loadMsgs(active.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // global unread across all my conversations
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`global-msg-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        const m = payload.new;
        if (m.sender_id !== user.id) {
          setUnread((u) => u + 1);
          loadConvs();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => { if (open) { setUnread(0); setPreview((p) => p ? { ...p, unread: 0 } : p); } }, [open, active?.id]);

  // Auto-translate incoming messages to the viewer's language.
  useEffect(() => {
    if (!user) return;
    const targets = messages.filter((m) => m.sender_id !== user.id && m.body && m.body.trim().length > 0);
    for (const m of targets) {
      const key = `${m.id}:${myLang}`;
      if (translations[key] || translatingRef.current.has(key)) continue;
      // Hydrate from localStorage cache first.
      try {
        const cached = window.localStorage.getItem(`elfo-trans:${key}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setTranslations((t) => ({ ...t, [key]: parsed }));
          continue;
        }
      } catch {}
      translatingRef.current.add(key);
      translateMessage({ data: { text: m.body!, target: myLang } })
        .then((res) => {
          const entry = { translated: res.translated, detected: res.detectedLang };
          setTranslations((t) => ({ ...t, [key]: entry }));
          try { window.localStorage.setItem(`elfo-trans:${key}`, JSON.stringify(entry)); } catch {}
        })
        .catch(() => {})
        .finally(() => { translatingRef.current.delete(key); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, myLang, user?.id]);


  const send = async () => {
    if (!active || !user || (!input.trim())) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: active.id,
        sender_id: user.id,
        sender_role: role,
        body: input.trim(),
      });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send");
    } finally { setSending(false); }
  };

  const upload = async (file: File) => {
    if (!active || !user) return;
    setSending(true);
    try {
      const path = `${active.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60 * 24 * 7);
      const { error } = await supabase.from("messages").insert({
        conversation_id: active.id,
        sender_id: user.id,
        sender_role: role,
        body: null,
        attachment_url: signed?.signedUrl ?? path,
        attachment_name: file.name,
        attachment_type: file.type,
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e?.message || "Failed to attach");
    } finally { setSending(false); }
  };

  const roleColor = (r: string) => r === "admin" ? "text-primary" : r === "developer" ? "text-amber-500" : "text-emerald-500";

  const label = useMemo(() => role === "client" ? "Chat with your team" : "Messages", [role]);

  if (!user) return null;

  return (
    <>
      {!open && (
        <div className="fixed bottom-4 right-4 z-40 flex items-end gap-2">
          {preview && preview.body && (
            <button
              onClick={() => setOpen(true)}
              className="hidden max-w-[260px] items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-left shadow-xl transition hover:bg-accent sm:flex"
              aria-label="Open latest message"
            >
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${roleColor(preview.sender_role)}`}>
                  {preview.sender_role} · {new Date(preview.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="truncate text-xs font-medium text-foreground">{preview.body}</div>
              </div>
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            style={{ backgroundImage: "var(--gradient-primary)", backgroundColor: "hsl(var(--primary))" }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-2xl electric-glow ring-2 ring-primary/40 transition hover:scale-105"
            aria-label="Open chat"
          >
            <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
            )}
          </button>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-card sm:inset-auto sm:bottom-4 sm:right-4 sm:z-40 sm:h-[560px] sm:max-h-[85vh] sm:w-[360px] sm:max-w-[92vw] sm:rounded-2xl sm:border sm:shadow-2xl">
          <div
            style={{ backgroundImage: "var(--gradient-primary)", backgroundColor: "hsl(var(--primary))" }}
            className="flex items-center justify-between border-b px-4 py-3 text-primary-foreground"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</div>
              <div className="truncate text-sm font-semibold">
                {active
                  ? (role === "admin" && active.peer_role
                      ? `${active.peer_role === "developer" ? "Developer" : "Client"} · ${active.peer_name || "—"}${active.project_name ? ` — ${active.project_name}` : ""}`
                      : (active.project_name || active.subject || active.peer_name || "Conversation"))
                  : "Select a conversation"}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-md ring-2 ring-white hover:bg-white/90"
            >
              <X className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>

          {(() => {
            const filtered = convs.filter((c) => {
              if (role === "admin") {
                if (filter === "clients" && c.peer_role !== "client") return false;
                if (filter === "developers" && c.peer_role !== "developer") return false;
              }
              if (search.trim()) {
                const q = search.toLowerCase();
                const hay = `${c.peer_name ?? ""} ${c.project_name ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
              }
              return true;
            });
            const clientCount = convs.filter((c) => c.peer_role === "client").length;
            const devCount = convs.filter((c) => c.peer_role === "developer").length;
            return (
              <>
                {role === "admin" && convs.length > 0 && (
                  <div className="space-y-2 border-b bg-muted/30 px-2 py-2">
                    <div className="flex gap-1">
                      {([
                        ["all", `All (${convs.length})`],
                        ["clients", `Clients (${clientCount})`],
                        ["developers", `Developers (${devCount})`],
                      ] as const).map(([k, lbl]) => (
                        <button
                          key={k}
                          onClick={() => setFilter(k)}
                          className={`flex-1 rounded-full px-2 py-1 text-[11px] font-semibold transition ${filter === k ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or project…"
                      className="w-full rounded-full border bg-background px-3 py-1 text-xs outline-none focus:border-primary"
                    />
                  </div>
                )}
                {(convs.length > 1 || role === "admin") && (
                  <div className="max-h-40 space-y-1 overflow-y-auto border-b bg-muted/10 p-2">
                    {filtered.length === 0 && (
                      <div className="py-3 text-center text-[11px] text-muted-foreground">No conversations</div>
                    )}
                    {filtered.map((c) => {
                      const isActive = active?.id === c.id;
                      const roleTag = c.peer_role === "developer" ? "DEV" : c.peer_role === "client" ? "CLIENT" : null;
                      const roleColorCls = c.peer_role === "developer" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActive(c)}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${isActive ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                        >
                          {role === "admin" && roleTag && (
                            <span className={`shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-bold tracking-wider ${roleColorCls}`}>{roleTag}</span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {role === "admin" ? (c.peer_name || "—") : (c.project_name || c.peer_name || "Chat")}
                            </div>
                            {c.project_name && role === "admin" && (
                              <div className={`truncate text-[10px] ${isActive ? "opacity-80" : "text-muted-foreground"}`}>{c.project_name}</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background/50 p-4">
            {messages.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No messages yet — say hello 👋</div>}
            {messages.map((m) => {
              const mine = m.sender_id === user.id;
              const key = `${m.id}:${myLang}`;
              const tr = !mine && m.body ? translations[key] : undefined;
              const isTranslated = !!tr && tr.detected && tr.detected.slice(0, 2) !== myLang.slice(0, 2) && tr.translated !== m.body;
              const wantOriginal = !!showOriginal[m.id];
              const shownBody = m.body ? (isTranslated && !wantOriginal ? tr!.translated : m.body) : null;
              const fromLangLabel = tr?.detected ? (LANGUAGES.find((l) => l.code.startsWith(tr.detected.slice(0, 2)))?.native ?? tr.detected.toUpperCase()) : "";
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`text-[10px] font-medium ${roleColor(m.sender_role)}`}>
                    {m.sender_name || m.sender_role} · <span className="capitalize opacity-70">{m.sender_role}</span>
                  </div>
                  <div className={`mt-0.5 max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}>
                    {shownBody && <div className="whitespace-pre-wrap break-words">{shownBody}</div>}
                    {m.attachment_url && (
                      <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs underline">
                        <Paperclip className="h-3 w-3" />{m.attachment_name}
                      </a>
                    )}
                    {isTranslated && (
                      <button
                        type="button"
                        onClick={() => setShowOriginal((s) => ({ ...s, [m.id]: !s[m.id] }))}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100"
                      >
                        <Languages className="h-3 w-3" />
                        {wantOriginal ? `Show translation` : `Translated from ${fromLangLabel}`}
                      </button>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {mine && (m.read_at ? <CheckCheck className="h-3 w-3 text-primary" /> : m.delivered_at ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t bg-card p-2">
            {active ? (
              <div className="flex items-center gap-1">
                <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button size="icon" variant="ghost" onClick={() => fileRef.current?.click()} disabled={sending}><Paperclip className="h-4 w-4" /></Button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <Button size="icon" onClick={send} disabled={sending || !input.trim()} className="rounded-full"><Send className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {role === "admin" ? "Conversations appear once a project has one." : "Waiting for your project to be set up."}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

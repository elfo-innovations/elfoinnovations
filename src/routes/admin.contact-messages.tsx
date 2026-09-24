import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Mail, MailOpen, Search, Trash2 } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { requireRole } from "@/lib/route-guards";

export const Route = createFileRoute("/admin/contact-messages")({
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Contact Messages — Admin" }] }),
  component: AdminContactMessages,
});

type Msg = Tables<"contact_messages">;

const STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES: Record<string, string> = {
  new: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  read: "border-sky-500/30 bg-sky-500/10 text-sky-500",
  replied: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  archived: "border-border bg-muted/40 text-muted-foreground",
};

function AdminContactMessages() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Msg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Msg | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-contact-messages"],
    queryFn: async () =>
      (
        await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false })
      ).data,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;
      return [m.message_code, m.full_name, m.email, m.phone, m.subject, m.message].some((v) =>
        v?.toLowerCase().includes(q),
      );
    });
  }, [data, search, statusFilter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-contact-messages"] });

  const updateStatus = async (id: string, status: string, silent = false) => {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (!silent) toast.success("Status updated");
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
    refresh();
  };

  const openMessage = (m: Msg) => {
    setSelected(m);
    if (m.status === "new") void updateStatus(m.id, "read", true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", deleteTarget.id);
    if (error) return toast.error(error.message);
    toast.success("Message deleted");
    if (selected?.id === deleteTarget.id) setSelected(null);
    setDeleteTarget(null);
    refresh();
  };

  const exportCsv = () => {
    if (!filtered.length) return toast.error("No messages to export");
    const cols: (keyof Msg)[] = [
      "message_code",
      "full_name",
      "email",
      "phone",
      "subject",
      "message",
      "status",
      "created_at",
    ];
    const esc = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const csv = [cols.join(","), ...filtered.map((r) => cols.map((c) => esc(r[c])).join(","))].join(
      "\n",
    );
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elfo-contact-messages-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} message${filtered.length === 1 ? "" : "s"}`);
  };

  const all = data ?? [];
  const newCount = all.filter((m) => m.status === "new").length;

  return (
    <DashboardShell role="admin">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Contact Messages
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Messages sent through the public Contact page. Open one to read it, reply by email, or
        change its status.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <StatCard label="Total messages" value={all.length} icon={Mail} />
        <StatCard label="New (unread)" value={newCount} icon={MailOpen} />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ref, name, email, subject, message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} className="sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openMessage(m)}
            className="glass-card rounded-2xl p-4 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-primary">{m.message_code}</div>
                <div
                  className={`mt-0.5 truncate ${m.status === "new" ? "font-bold" : "font-semibold"}`}
                >
                  {m.subject}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {m.full_name} · {m.email}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] ${STATUS_STYLES[m.status] ?? ""}`}
              >
                {m.status}
              </Badge>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No contact messages yet.
          </div>
        )}
      </div>

      <div className="glass-card mt-6 hidden overflow-hidden rounded-2xl lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t hover:bg-accent/30">
                <td className="px-4 py-3 font-mono text-xs text-primary">{m.message_code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{m.full_name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td
                  className={`max-w-[280px] truncate px-4 py-3 ${m.status === "new" ? "font-bold" : ""}`}
                >
                  {m.subject}
                </td>
                <td className="px-4 py-3">
                  <Select value={m.status} onValueChange={(v) => updateStatus(m.id, v)}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {format(new Date(m.created_at), "MMM d, yyyy h:mm a")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => openMessage(m)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No contact messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="break-words">{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-4">
              <div className="grid gap-1 rounded-xl border bg-muted/30 p-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ref:</span>{" "}
                  <span className="font-mono text-primary">{selected.message_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Name:</span> {selected.full_name}
                </div>
                <div className="break-all">
                  <span className="text-muted-foreground">Email:</span> {selected.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {selected.phone ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Received:</span>{" "}
                  {format(new Date(selected.created_at), "MMM d, yyyy h:mm a")}
                </div>
              </div>
              <div className="whitespace-pre-wrap break-words rounded-xl border p-4 text-sm">
                {selected.message}
              </div>
              <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => selected && setDeleteTarget(selected)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            {selected && (
              <Button asChild>
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  onClick={() =>
                    selected.status !== "replied" && updateStatus(selected.id, "replied", true)
                  }
                >
                  <Mail className="mr-2 h-4 w-4" /> Reply by email
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget?.message_code} from {deleteTarget?.full_name} will be permanently deleted.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

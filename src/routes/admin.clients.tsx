import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Eye, EyeOff, KeyRound, Link2, Loader2, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { createClientWithLogin } from "@/lib/clients.functions";
import { deleteClientAccount, adminResetUserPassword, shareCredentialsEmail } from "@/lib/account.functions";
import { generateBrandedPassword } from "@/lib/branded-password";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Clients — Admin" }] }),
  component: AdminClients,
});

function genPassword() {
  return generateBrandedPassword();
}

function AdminClients() {
  const qc = useQueryClient();
  const createClient = useServerFn(createClientWithLogin);
  const deleteClient = useServerFn(deleteClientAccount);
  const resetPw = useServerFn(adminResetUserPassword);
  const shareCreds = useServerFn(shareCredentialsEmail);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionBusy, setActionBusy] = useState<null | "done" | "share">(null);
  const [credentials, setCredentials] = useState<null | { name: string; email: string; password: string }>(null);
  const [resetDraft, setResetDraft] = useState<null | { user_id: string; name: string; email: string; password: string }>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", company: "", country: "", notes: "" });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "connected">("all");

  const { data } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => (await supabase.from("clients").select("*").order("created_at", { ascending: false })).data,
  });

  // Build lookup maps for the referral network: who referred whom.
  const clientsById = new Map((data ?? []).map((c: any) => [c.id, c]));
  const referrerIds = new Set((data ?? []).filter((c: any) => c.referred_by_client_id).map((c: any) => c.referred_by_client_id));
  const referredCountByReferrer = new Map<string, number>();
  (data ?? []).forEach((c: any) => {
    if (c.referred_by_client_id) {
      referredCountByReferrer.set(c.referred_by_client_id, (referredCountByReferrer.get(c.referred_by_client_id) ?? 0) + 1);
    }
  });
  const isConnected = (c: any) => !!c.referred_by_client_id || referrerIds.has(c.id);

  const reset = () => {
    setForm({ full_name: "", email: "", password: "", phone: "", company: "", country: "", notes: "" });
    setShowPw(false);
  };

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return toast.error("Name and email are required");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      await createClient({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
          country: form.country.trim() || null,
          notes: form.notes.trim() || null,
        },
      });
      toast.success("Client created — Done to close, or Share to email the login now");
      setCredentials({ name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      setOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create client");
    } finally {
      setBusy(false);
    }
  };

  const copyCreds = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(`Portal: ${window.location.origin}/auth\nEmail: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Credentials modal (after create): Done just closes, Share also emails the login.
  const doneCreate = () => setCredentials(null);
  const shareCreate = async () => {
    if (!credentials) return;
    setActionBusy("share");
    try {
      await shareCreds({ data: { to: credentials.email, name: credentials.name, password: credentials.password } });
      toast.success("Credentials emailed to " + credentials.email);
      setCredentials(null);
    } catch (e: any) {
      toast.error(e?.message || "Failed to send email");
    } finally {
      setActionBusy(null);
    }
  };

  // Reset-password draft modal: nothing happens in the DB until Done or Share is clicked.
  const doneReset = async () => {
    if (!resetDraft) return;
    setActionBusy("done");
    try {
      await resetPw({ data: { target_user_id: resetDraft.user_id, new_password: resetDraft.password } });
      toast.success("Password reset");
      setResetDraft(null);
    } catch (e: any) {
      toast.error(e?.message || "Reset failed");
    } finally {
      setActionBusy(null);
    }
  };
  const shareReset = async () => {
    if (!resetDraft) return;
    setActionBusy("share");
    try {
      await resetPw({ data: { target_user_id: resetDraft.user_id, new_password: resetDraft.password } });
      await shareCreds({ data: { to: resetDraft.email, name: resetDraft.name, password: resetDraft.password } });
      toast.success("Password reset & credentials emailed to " + resetDraft.email);
      setResetDraft(null);
    } catch (e: any) {
      toast.error(e?.message || "Reset/email failed");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create client portal access and share credentials.</p>
        </div>
        <Button onClick={() => { setForm((f) => ({ ...f, password: genPassword() })); setOpen(true); }} className="rounded-full electric-glow">
          <Plus className="mr-1.5 h-4 w-4" /> Add Client
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, company…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex shrink-0 rounded-full border border-border bg-muted/30 p-1">
          <button
            onClick={() => setView("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${view === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Clients
          </button>
          <button
            onClick={() => setView("connected")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${view === "connected" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-3.5 w-3.5" /> Connected Clients
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? [])
          .filter((c: any) => {
            const q = search.trim().toLowerCase();
            if (q && ![c.full_name, c.email, c.phone, c.company, c.country].some((v) => v?.toLowerCase().includes(q))) return false;
            if (view === "connected" && !isConnected(c)) return false;
            return true;
          })
          .map((c: any) => {
          const referrer = c.referred_by_client_id ? clientsById.get(c.referred_by_client_id) : null;
          const referredCount = referredCountByReferrer.get(c.id) ?? 0;
          return (
          <div key={c.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 truncate font-semibold">{c.full_name}</div>
              {c.user_id && (
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Portal
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">{c.email}</div>
            {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
            {c.company && <div className="mt-2 text-xs">{c.company}</div>}
            {c.user_id && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <KeyRound className="h-3 w-3" /> Client login active
              </div>
            )}
            {referrer && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-500">
                <Link2 className="h-3 w-3 shrink-0" /> {c.full_name} used {referrer.full_name}'s referral
              </div>
            )}
            {referredCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <Users className="h-3 w-3 shrink-0" /> Referred {referredCount} client{referredCount > 1 ? "s" : ""}
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-1">
              {c.user_id && (
                <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10"
                  onClick={() => setResetDraft({ user_id: c.user_id, name: c.full_name, email: c.email, password: generateBrandedPassword() })}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reset Password
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!confirm(`Delete ${c.full_name}? This removes their portal access.`)) return;
                  try { await deleteClient({ data: { client_id: c.id } }); toast.success("Client deleted"); qc.invalidateQueries({ queryKey: ["admin-clients"] }); }
                  catch (e: any) { toast.error(e?.message || "Delete failed"); }
                }}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>

        );})}
        {(!data || data.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No clients yet. Click "Add Client" to create portal access.
          </div>
        )}
        {data && data.length > 0 && view === "connected" && !data.some((c: any) => isConnected(c)) && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No connected clients yet — no one has used a referral code so far.
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email * (used to sign into the client portal)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pr-9" />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: genPassword() })}>Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this password with the client after creation.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy} className="electric-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Client & Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(v) => !v && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Client Portal Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Share these with the client. This password won't be shown again — copy it now.</p>
            <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm">
              <div><span className="text-muted-foreground">Portal:</span> {typeof window !== "undefined" ? window.location.origin : ""}/auth</div>
              <div><span className="text-muted-foreground">Email:</span> {credentials?.email}</div>
              <div><span className="text-muted-foreground">Password:</span> {credentials?.password}</div>
            </div>
            <Button onClick={copyCreds} className="w-full">
              {copied ? <><Check className="mr-2 h-4 w-4" /> Copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy all</>}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={doneCreate} disabled={!!actionBusy}>Done</Button>
            <Button onClick={shareCreate} disabled={!!actionBusy} className="electric-glow">
              {actionBusy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetDraft} onOpenChange={(v) => !v && setResetDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Reset Password — {resetDraft?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={resetDraft?.email ?? ""} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={resetDraft?.password ?? ""}
                    onChange={(e) => setResetDraft((d) => (d ? { ...d, password: e.target.value } : d))}
                    className="pr-9"
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={() => setResetDraft((d) => (d ? { ...d, password: generateBrandedPassword() } : d))}>Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground">Nothing changes until you click Done or Share below.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={doneReset} disabled={!!actionBusy}>
              {actionBusy === "done" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Done"}
            </Button>
            <Button onClick={shareReset} disabled={!!actionBusy} className="electric-glow">
              {actionBusy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
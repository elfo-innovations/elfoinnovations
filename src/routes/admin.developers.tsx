import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, Copy, Check, Eye, EyeOff, KeyRound, Trash2, RefreshCw, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { createDeveloperWithLogin } from "@/lib/developers.functions";
import { deleteDeveloperAccount, adminResetUserPassword } from "@/lib/account.functions";
import { generateBrandedPassword } from "@/lib/branded-password";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/developers")({
  head: () => ({ meta: [{ title: "Developers — Admin" }] }),
  component: AdminDevelopers,
});

function genPassword() {
  return generateBrandedPassword();
}

function AdminDevelopers() {
  const qc = useQueryClient();
  const createDev = useServerFn(createDeveloperWithLogin);
  const deleteDev = useServerFn(deleteDeveloperAccount);
  const resetPw = useServerFn(adminResetUserPassword);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [credentials, setCredentials] = useState<null | { email: string; password: string }>(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    skills: "",
    status: "available" as "available" | "busy" | "on_leave",
    bio: "",
  });

  const { data } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: async () => (await supabase.from("developers").select("*").order("created_at", { ascending: false })).data,
  });

  const reset = () => {
    setForm({ full_name: "", email: "", password: "", phone: "", skills: "", status: "available", bio: "" });
    setShowPw(false);
  };

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return toast.error("Name and email are required");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      await createDev({
        data: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          status: form.status,
          bio: form.bio.trim() || null,
        },
      });
      toast.success("Developer created — share the login below");
      setCredentials({ email: form.email.trim(), password: form.password });
      setOpen(false);
      reset();
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create developer");
    } finally {
      setBusy(false);
    }
  };

  const copyCreds = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `Portal: ${window.location.origin}/auth\nEmail: ${credentials.email}\nPassword: ${credentials.password}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardShell role="admin">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Developers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Onboard engineers and issue portal credentials.</p>
        </div>
        <Button onClick={() => { setForm((f) => ({ ...f, password: genPassword() })); setOpen(true); }} className="rounded-full electric-glow">
          <Plus className="mr-1.5 h-4 w-4" /> Add Developer
        </Button>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or skill…"
          className="pl-9"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? [])
          .filter((d: any) => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            const hay = [d.full_name, d.email, d.phone, d.status, ...(d.skills ?? [])]
              .filter(Boolean).join(" ").toLowerCase();
            return hay.includes(q);
          })
          .map((d: any) => (
          <div key={d.id} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 truncate font-semibold">{d.full_name}</div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary">{d.status}</span>
            </div>
            <div className="truncate text-xs text-muted-foreground">{d.email}</div>
            {d.phone && <div className="text-xs text-muted-foreground">{d.phone}</div>}
            <div className="mt-3 flex flex-wrap gap-1">
              {(d.skills ?? []).slice(0, 6).map((s: string) => (
                <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">{s}</span>
              ))}
            </div>
            {d.user_id && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <KeyRound className="h-3 w-3" /> Portal access
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-1">
              {d.user_id && (
                <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10"
                  onClick={async () => {
                    const pw = generateBrandedPassword();
                    try {
                      await resetPw({ data: { target_user_id: d.user_id, new_password: pw } });
                      setCredentials({ email: d.email, password: pw });
                      toast.success("Password reset — share the new login");
                    } catch (e: any) { toast.error(e?.message || "Reset failed"); }
                  }}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reset Password
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!confirm(`Delete ${d.full_name}? This removes their portal access.`)) return;
                  try { await deleteDev({ data: { developer_id: d.id } }); toast.success("Developer deleted"); qc.invalidateQueries({ queryKey: ["admin-developers"] }); }
                  catch (e: any) { toast.error(e?.message || "Delete failed"); }
                }}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No developers yet. Click "Add Developer" to onboard your first engineer.
          </div>
        )}
      </div>


      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Developer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email * (used to sign into the developer portal)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: genPassword() })}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Min 8 characters. Share this with the developer after creation.</p>
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Skills (comma-separated)</Label>
              <Input placeholder="React, Node, PostgreSQL" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Bio</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={busy} className="electric-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Developer & Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(v) => !v && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Portal Credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share these with the developer. This password won't be shown again — copy it now.
            </p>
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
            <Button variant="ghost" onClick={() => setCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

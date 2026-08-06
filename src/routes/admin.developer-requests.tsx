import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Search, FileText, Github, Linkedin, Globe, Mail, Phone, MapPin, Check, X, RefreshCw, Copy, UserPlus, Clock, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { DashboardShell, StatCard } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import {
  approveDeveloperApplication, rejectDeveloperApplication, getResumeDownloadUrl,
} from "@/lib/developer-applications.functions";
import { generateBrandedPassword } from "@/lib/branded-password";
import { usernameFromEmail } from "@/lib/application-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/developer-requests")({
  head: () => ({ meta: [{ title: "Developer Requests — Admin" }] }),
  component: AdminDeveloperRequests,
});

type Status = "pending" | "accepted" | "rejected";

const STATUS_STYLES: Record<Status, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

function defaultAcceptMessage(name: string) {
  return `Congratulations ${name}!

After reviewing your application, we're delighted to welcome you to the ELFO Innovations engineering team. Your developer portal account has been created and your login details are below.`;
}

function defaultRejectMessage(name: string) {
  return `Hi ${name},

Thank you for your interest in joining ELFO Innovations. After careful review, we have decided not to move forward with your application at this time.`;
}

function AdminDeveloperRequests() {
  const qc = useQueryClient();
  const approve = useServerFn(approveDeveloperApplication);
  const reject = useServerFn(rejectDeveloperApplication);
  const resumeUrl = useServerFn(getResumeDownloadUrl);

  const [tab, setTab] = useState<Status | "all">("pending");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<null | "accept" | "reject">(null);
  const [active, setActive] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["developer_applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = useMemo(() => {
    const rows = apps ?? [];
    return {
      all: rows.length,
      pending: rows.filter((r: any) => r.status === "pending").length,
      accepted: rows.filter((r: any) => r.status === "accepted").length,
      rejected: rows.filter((r: any) => r.status === "rejected").length,
    };
  }, [apps]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (apps ?? [])
      .filter((r: any) => (tab === "all" ? true : r.status === tab))
      .filter((r: any) =>
        !q ||
        [r.full_name, r.email, r.primary_role, r.country, r.city, ...(r.skills ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
  }, [apps, tab, search]);

  const openAccept = (row: any) => {
    setActive(row);
    setMode("accept");
    setSubject("Welcome to Elfo Innovations 🎉");
    setMessage(defaultAcceptMessage(row.full_name));
    setUsername(usernameFromEmail(row.email));
    setPassword(generateBrandedPassword());
  };

  const openReject = (row: any) => {
    setActive(row);
    setMode("reject");
    setSubject("Update on your application — ELFO Innovations");
    setMessage(defaultRejectMessage(row.full_name));
  };

  const submitDecision = async () => {
    if (!active || !mode) return;
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message are required");
    setBusy(true);
    try {
      const payload: any = {
        id: active.id,
        subject: subject.trim(),
        message: message.trim(),
        ...(mode === "accept"
          ? { username: username.trim(), password, loginUrl: `${window.location.origin}/auth` }
          : {}),
      };
      const res: any = mode === "accept" ? await approve({ data: payload }) : await reject({ data: payload });
      qc.invalidateQueries({ queryKey: ["developer_applications"] });
      qc.invalidateQueries({ queryKey: ["developers"] });
      if (res?.emailSent) toast.success(mode === "accept" ? "Approved — welcome email sent" : "Rejected — email sent");
      else toast.warning(`Saved, but the email was not sent: ${res?.emailError ?? "email provider not configured"}`);
      setMode(null);
      setActive(null);
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const openResume = async (path: string) => {
    try {
      const res: any = await resumeUrl({ data: { path } });
      window.open(res.url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e?.message || "Could not open resume");
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Developer requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review applications, approve talent, and send branded decisions.</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => qc.invalidateQueries({ queryKey: ["developer_applications"] })}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={counts.all} icon={UserPlus} />
        <StatCard label="Pending" value={counts.pending} icon={Clock} />
        <StatCard label="Accepted" value={counts.accepted} icon={ThumbsUp} />
        <StatCard label="Rejected" value={counts.rejected} icon={ThumbsDown} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["pending", "accepted", "rejected", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${tab === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}
            >
              {t} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="rounded-xl pl-9" placeholder="Search name, email, skills…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading applications…</div>}
        {!isLoading && rows.length === 0 && (
          <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">No applications here yet.</div>
        )}
        {rows.map((r: any) => (
          <div key={r.id} className="glass-card rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{r.full_name}</h3>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[r.status as Status]}`}>{r.status}</span>
                </div>
                <div className="mt-1 text-sm font-medium text-primary">{r.primary_role} · {r.years_experience} · {r.current_status}</div>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{r.email}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0 text-primary" />{r.phone}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-primary" />{r.city}, {r.country}</div>
            </div>

            {r.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.skills.map((s: string) => (
                  <span key={s} className="rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium">{s}</span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Bio: </span>{r.bio}</p>
              <p><span className="font-semibold text-foreground">Motivation: </span>{r.motivation}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a href={r.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Github className="h-3.5 w-3.5" /> GitHub</a>
              {r.linkedin_url && <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</a>}
              {r.portfolio_url && <a href={r.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent"><Globe className="h-3.5 w-3.5" /> Portfolio</a>}
              {r.resume_path && (
                <button onClick={() => openResume(r.resume_path)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <FileText className="h-3.5 w-3.5" /> {r.resume_name || "Resume.pdf"}
                </button>
              )}
            </div>

            {r.status === "pending" ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button className="rounded-full electric-glow" onClick={() => openAccept(r)}><Check className="mr-2 h-4 w-4" /> Accept & create account</Button>
                <Button variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => openReject(r)}><X className="mr-2 h-4 w-4" /> Reject</Button>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">{r.decision_subject}</div>
                <div className="mt-1 whitespace-pre-wrap">{r.decision_message}</div>
                {r.reviewed_at && <div className="mt-2">Decided {new Date(r.reviewed_at).toLocaleString()}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={mode !== null} onOpenChange={(v) => !v && setMode(null)}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-2xl sm:w-full">
          <DialogHeader>
            <DialogTitle>{mode === "accept" ? "Accept application" : "Reject application"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email subject</Label>
              <Input className="mt-1.5 rounded-xl" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea className="mt-1.5 min-h-[140px] rounded-xl" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            {mode === "accept" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Username</Label>
                  <Input className="mt-1.5 rounded-xl" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                  <Label>Temporary password</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input className="rounded-xl font-mono text-xs" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-xl" onClick={() => setPassword(generateBrandedPassword())} aria-label="Regenerate"><RefreshCw className="h-4 w-4" /></Button>
                    <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-xl" onClick={() => { navigator.clipboard.writeText(password); toast.success("Password copied"); }} aria-label="Copy"><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setMode(null)}>Cancel</Button>
            <Button className="rounded-full" onClick={submitDecision} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "accept" ? "Approve & send email" : "Reject & send email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Loader2, FileText, Download, CheckCircle2, Clock, Circle, Send, Lock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;
const STAGE_STATUSES = ["pending", "delivered", "admin_review", "admin_approved", "sent_to_client", "client_approved", "revision_requested"];

function stageVisual(status: string) {
  if (["client_approved", "admin_approved"].includes(status)) return { color: "bg-emerald-500", text: "text-emerald-500", label: "Approved", icon: CheckCircle2 };
  if (["sent_to_client", "delivered", "admin_review", "revision_requested"].includes(status)) return { color: "bg-amber-400", text: "text-amber-500", label: "In review", icon: Clock };
  return { color: "bg-muted-foreground/40", text: "text-muted-foreground", label: "Not started", icon: Circle };
}

export const Route = createFileRoute("/admin/project/$id")({
  component: AdminProjectDetail,
});

function AdminProjectDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadingStage, setUploadingStage] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data: project } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: async () => (await supabase.from("projects").select("*, project_stages(*), project_files(*), clients(full_name, email), developers(full_name)").eq("id", id).maybeSingle()).data,
  });

  const { data: devs } = useQuery({
    queryKey: ["all-devs"],
    queryFn: async () => (await supabase.from("developers").select("id, full_name, status").order("full_name")).data ?? [],
  });

  const assignDev = async (developer_id: string) => {
    const { error } = await supabase.from("projects").update({ developer_id: developer_id || null }).eq("id", id);
    if (error) return toast.error(error.message);
    // ensure conversation exists for messaging
    if (project?.client_id) {
      const { data: existing } = await supabase.from("conversations").select("id").eq("project_id", id).maybeSingle();
      if (!existing) {
        await supabase.from("conversations").insert({ client_id: project.client_id, project_id: id, subject: project.name });
      }
    }
    toast.success("Developer assigned");
    qc.invalidateQueries({ queryKey: ["admin-project", id] });
  };

  const updateStage = async (stageId: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("project_stages").update(patch as any).eq("id", stageId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-project", id] });
  };

  const upload = async (stage: string, file: File, visible_to_client: boolean) => {
    setUploadingStage(stage);
    try {
      const path = `${id}/${stage}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("project-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(path, 60 * 60 * 24 * 365);
      const { error } = await supabase.from("project_files").insert({
        project_id: id,
        stage: stage as any,
        file_name: file.name,
        storage_path: signed?.signedUrl ?? path,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user?.id,
        visible_to_client,
      });
      if (error) throw error;
      toast.success("File uploaded");
      qc.invalidateQueries({ queryKey: ["admin-project", id] });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally { setUploadingStage(null); }
  };

  const closeProject = async () => {
    if (!project) return;
    if (!confirm("Close this project? The client's portal access will be revoked. All records stay in your admin CRM.")) return;
    setClosing(true);
    try {
      const now = new Date().toISOString();
      const { error: pErr } = await supabase.from("projects").update({ status: "completed" as any, closed_at: now, progress_percent: 100 } as any).eq("id", id);
      if (pErr) throw pErr;
      if (project.client_id) {
        const { error: cErr } = await supabase.from("clients").update({ closed_at: now } as any).eq("id", project.client_id);
        if (cErr) throw cErr;
        const { data: cli } = await supabase.from("clients").select("source_lead_id").eq("id", project.client_id).maybeSingle();
        if (cli?.source_lead_id) {
          await supabase.from("leads").update({ status: "converted" as any }).eq("id", cli.source_lead_id);
        }
      }
      toast.success("Project closed. Client portal access revoked.");
      qc.invalidateQueries({ queryKey: ["admin-project", id] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to close project");
    } finally { setClosing(false); }
  };

  if (!project) return <DashboardShell role="admin"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  const stages = [...(project.project_stages ?? [])].sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return (
    <DashboardShell role="admin">
      <Link to="/admin/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">{project.project_code}</div>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{project.name}</h1>
            <div className="mt-2 text-xs text-muted-foreground">
              Client: <b>{project.clients?.full_name}</b> · {project.clients?.email}
            </div>
            {project.requirements && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">{project.requirements}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge>{project.status}</Badge>
            {project.closed_at && <Badge variant="outline" className="border-emerald-500 text-emerald-600">Closed · {new Date(project.closed_at).toLocaleDateString()}</Badge>}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-1.5">
            <Label className="text-xs">Assign developer</Label>
            <Select value={project.developer_id ?? ""} onValueChange={assignDev}>
              <SelectTrigger><SelectValue placeholder="Select developer" /></SelectTrigger>
              <SelectContent>
                {(devs ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.full_name} · {d.status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {project.developers && <div className="text-xs text-muted-foreground">Currently: <b>{project.developers.full_name}</b></div>}
        </div>

        {(() => {
          const allApproved = stages.length > 0 && stages.every((x: any) => x.status === "client_approved");
          if (project.closed_at) {
            return (
              <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                Project has been closed. Client portal access is revoked. Records remain in your admin CRM.
              </div>
            );
          }
          return (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/50 p-3">
              <div className="text-xs text-muted-foreground">
                {allApproved
                  ? "All 4 stages are client-approved. You can close this project and revoke the client's portal access."
                  : "Close will be available once all 4 stages are client-approved."}
              </div>
              <Button size="sm" variant="destructive" disabled={!allApproved || closing} onClick={closeProject}>
                {closing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-1 h-3.5 w-3.5" />}
                Close project
              </Button>
            </div>
          );
        })()}
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">4-stage pipeline</h2>

      <div className="mt-4 space-y-4">
        {STAGE_ORDER.map((stageName) => {
          const s = stages.find((x: any) => x.stage === stageName);
          if (!s) return null;
          const v = stageVisual(s.status);
          const stageFiles = (project.project_files ?? []).filter((f: any) => f.stage === stageName);
          const Icon = v.icon;
          return (
            <div key={s.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${v.color} text-white`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold capitalize">{stageName}</div>
                    <div className={`text-xs font-medium ${v.text}`}>{v.label}</div>
                  </div>
                </div>
                <Select value={s.status} onValueChange={(status) => updateStage(s.id, { status, ...(status === "admin_approved" ? { admin_approved_at: new Date().toISOString() } : {}), ...(status === "sent_to_client" ? { sent_to_client_at: new Date().toISOString() } : {}) })}>
                  <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGE_STATUSES.map((st) => <SelectItem key={st} value={st}>{st.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Textarea
                  rows={2}
                  placeholder="Admin note to client…"
                  value={comments[s.id] ?? s.admin_comment ?? ""}
                  onChange={(e) => setComments({ ...comments, [s.id]: e.target.value })}
                />
                <Button size="sm" variant="outline" onClick={() => updateStage(s.id, { admin_comment: comments[s.id] ?? "" })}>Save note</Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(stageName, f, true); e.currentTarget.value = ""; }} />
                  <span className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs hover:border-primary">
                    {uploadingStage === stageName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload for client
                  </span>
                </Label>
                {s.status !== "sent_to_client" && s.status !== "client_approved" && (
                  <Button size="sm" variant="outline" onClick={() => updateStage(s.id, { status: "sent_to_client", sent_to_client_at: new Date().toISOString() })}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Send to client
                  </Button>
                )}
              </div>

              {stageFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {stageFiles.map((f: any) => (
                    <a key={f.id} href={f.storage_path} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-background p-2.5 text-xs hover:border-primary">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{f.file_name}</span>
                        {!f.visible_to_client && <Badge variant="outline" className="ml-1 text-[9px]">internal</Badge>}
                      </span>
                      <Download className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}

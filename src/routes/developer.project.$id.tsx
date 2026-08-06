import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Upload, Loader2, FileText, Download, CheckCircle2, Clock, Circle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;
const DEV_STATUSES = ["pending", "delivered", "admin_review", "revision_requested"];

function stageVisual(status: string) {
  if (["client_approved", "admin_approved"].includes(status)) return { color: "bg-emerald-500", text: "text-emerald-500", label: "Approved", icon: CheckCircle2 };
  if (["sent_to_client", "delivered", "admin_review", "revision_requested"].includes(status)) return { color: "bg-amber-400", text: "text-amber-500", label: "In review", icon: Clock };
  return { color: "bg-muted-foreground/40", text: "text-muted-foreground", label: "Not started", icon: Circle };
}

export const Route = createFileRoute("/developer/project/$id")({
  component: DevProjectDetail,
});

function DevProjectDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadingStage, setUploadingStage] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data: project } = useQuery({
    queryKey: ["dev-project", id],
    queryFn: async () => (await supabase.from("projects").select("*, project_stages(*), project_files(*), clients(full_name)").eq("id", id).maybeSingle()).data,
  });

  const updateStage = async (stageId: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("project_stages").update(patch as any).eq("id", stageId);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["dev-project", id] });
  };

  const upload = async (stage: string, file: File) => {
    setUploadingStage(stage);
    try {
      const path = `${id}/${stage}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("project-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("project-files").createSignedUrl(path, 60 * 60 * 24 * 365);
      const { error } = await supabase.from("project_files").insert({
        project_id: id, stage: stage as any, file_name: file.name,
        storage_path: signed?.signedUrl ?? path, file_type: file.type, file_size: file.size,
        uploaded_by: user?.id, visible_to_client: false,
      });
      if (error) throw error;
      toast.success("File uploaded to admin");
      qc.invalidateQueries({ queryKey: ["dev-project", id] });
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setUploadingStage(null); }
  };

  if (!project) return <DashboardShell role="developer"><div className="p-8 text-sm text-muted-foreground">Loading…</div></DashboardShell>;

  const stages = [...(project.project_stages ?? [])].sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));

  return (
    <DashboardShell role="developer">
      <Link to="/developer/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">{project.project_code}</div>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{project.name}</h1>
            {project.clients && <div className="mt-2 text-xs text-muted-foreground">Client: <b>{project.clients.full_name}</b></div>}
            {project.requirements && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">{project.requirements}</p>}
          </div>
          <Badge>{project.status}</Badge>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">4-stage pipeline</h2>
      <p className="text-xs text-muted-foreground">Upload deliverables and mark stages ready for admin review. The admin forwards approved work to the client.</p>

      <div className="mt-4 space-y-4">
        {STAGE_ORDER.map((stageName) => {
          const s = stages.find((x: any) => x.stage === stageName);
          if (!s) return null;
          const v = stageVisual(s.status);
          const stageFiles = (project.project_files ?? []).filter((f: any) => f.stage === stageName);
          const Icon = v.icon;
          const locked = ["admin_approved", "sent_to_client", "client_approved"].includes(s.status);
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
                <Select value={s.status} disabled={locked} onValueChange={(status) => updateStage(s.id, { status, ...(status === "delivered" ? { submitted_at: new Date().toISOString() } : {}) })}>
                  <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEV_STATUSES.map((st) => <SelectItem key={st} value={st}>{st.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <Textarea rows={2} placeholder="Note to admin…" value={comments[s.id] ?? s.developer_comment ?? ""}
                  onChange={(e) => setComments({ ...comments, [s.id]: e.target.value })} />
                <Button size="sm" variant="outline" onClick={() => updateStage(s.id, { developer_comment: comments[s.id] ?? "" })}>Save note</Button>
              </div>

              {!locked && (
                <div className="mt-3">
                  <Label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(stageName, f); e.currentTarget.value = ""; }} />
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs hover:border-primary">
                      {uploadingStage === stageName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload deliverable
                    </span>
                  </Label>
                </div>
              )}

              {stageFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {stageFiles.map((f: any) => (
                    <a key={f.id} href={f.storage_path} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-background p-2.5 text-xs hover:border-primary">
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{f.file_name}</span>
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

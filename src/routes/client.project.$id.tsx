import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, Circle, Download, FileText, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;

// approved = green | pending (in review with admin/client) = yellow | not started = gray
function stageVisual(status: string) {
  if (["client_approved", "admin_approved"].includes(status)) return { color: "bg-emerald-500", text: "text-emerald-500", label: "Approved", icon: CheckCircle2 };
  if (["sent_to_client", "delivered", "admin_review", "revision_requested"].includes(status)) return { color: "bg-amber-400", text: "text-amber-500", label: "Pending review", icon: Clock };
  return { color: "bg-muted", text: "text-muted-foreground", label: "Not started", icon: Circle };
}

export const Route = createFileRoute("/client/project/$id")({
  component: ClientProjectDetail,
});

function ClientProjectDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: project } = useQuery({
    queryKey: ["client-project", id],
    queryFn: async () => (await supabase.from("projects").select("*, project_stages(*), project_files(*)").eq("id", id).maybeSingle()).data,
  });

  const approveStage = async (stageId: string) => {
    const { error } = await supabase.from("project_stages").update({ status: "client_approved" as any, client_approved_at: new Date().toISOString() }).eq("id", stageId);
    if (error) return toast.error(error.message);
    toast.success("Stage approved");
    qc.invalidateQueries({ queryKey: ["client-project", id] });
  };

  const rejectStage = async (stageId: string) => {
    if (!rejectNote.trim()) return toast.error("Please add a note explaining what to change");
    const { error } = await supabase.from("project_stages").update({ status: "revision_requested" as any, client_comment: rejectNote.trim() }).eq("id", stageId);
    if (error) return toast.error(error.message);
    toast.success("Revision requested");
    setRejectFor(null); setRejectNote("");
    qc.invalidateQueries({ queryKey: ["client-project", id] });
  };


  if (!project) {
    return <DashboardShell role="client"><div className="p-8 text-sm text-muted-foreground">Loading project…</div></DashboardShell>;
  }

  const stages = [...(project.project_stages ?? [])].sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
  const files = (project.project_files ?? []).filter((f: any) => f.visible_to_client);

  return (
    <DashboardShell role="client">
      <Link to="/client/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">{project.project_code}</div>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{project.name}</h1>
            {project.requirements && <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">{project.requirements}</p>}
          </div>
          <Badge>{project.status}</Badge>
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-bold">Project pipeline</h2>
      <p className="text-xs text-muted-foreground">Approve each stage after reviewing what the team delivered.</p>

      <div className="mt-4 grid gap-3">
        {STAGE_ORDER.map((stageName) => {
          const s = stages.find((x: any) => x.stage === stageName);
          const v = stageVisual(s?.status ?? "pending");
          const stageFiles = files.filter((f: any) => f.stage === stageName);
          const canApprove = s?.status === "sent_to_client";
          const Icon = v.icon;
          return (
            <div key={stageName} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${v.color} text-white`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold capitalize">{stageName}</div>
                    <div className={`text-xs font-medium ${v.text}`}>{v.label}</div>
                  </div>
                </div>
                {canApprove && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => approveStage(s!.id)} className="rounded-full electric-glow">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setRejectFor(s!.id); setRejectNote(""); }} className="rounded-full">
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>

              {s?.admin_comment && <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs"><b>Admin note:</b> {s.admin_comment}</div>}
              {s?.client_comment && s?.status === "revision_requested" && (
                <div className="mt-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"><b>Your revision note:</b> {s.client_comment}</div>
              )}

              {rejectFor === s?.id && (
                <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <Textarea rows={3} placeholder="What needs to change?" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setRejectFor(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => rejectStage(s!.id)}>Send request</Button>
                  </div>
                </div>
              )}


              {stageFiles.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {stageFiles.map((f: any) => (
                    <a key={f.id} href={f.storage_path} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-background p-2.5 text-xs transition hover:border-primary">
                      <span className="flex items-center gap-2 truncate"><FileText className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{f.file_name}</span></span>
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

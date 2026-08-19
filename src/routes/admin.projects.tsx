import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;
const COMPLETED = new Set(["admin_approved", "sent_to_client", "client_approved"]);

export const Route = createFileRoute("/admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Admin" }] }),
  component: () => {
    const { data } = useQuery({
      queryKey: ["admin-projects"],
      queryFn: async () => (await supabase.from("projects").select("*, project_stages(*), clients(full_name)").order("created_at", { ascending: false })).data,
    });
    return (
      <DashboardShell role="admin">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">Click a project to manage stages, upload files, and assign developers.</p>
        <div className="mt-6 space-y-4">
          {(data ?? []).map((p: any) => {
            const stages = [...(p.project_stages ?? [])].sort((a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
            const done = stages.filter((s: any) => COMPLETED.has(s.status)).length;
            const total = stages.length || 4;
            return (
              <Link key={p.id} to="/admin/project/$id" params={{ id: p.id }} className="glass-card block rounded-2xl p-6 transition hover:border-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-widest text-primary">{p.project_code}</div>
                    <h3 className="mt-1 font-display text-xl font-bold">{p.name}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">{p.clients?.full_name ?? "Unassigned client"}</div>
                    {p.requirements && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.requirements}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.discount_percent > 0 && (
                      <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                        🎉 {p.discount_percent}% Referral Discount
                      </span>
                    )}
                    <Badge>{p.status}</Badge><ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span>{done}/{total} stages</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-[var(--gradient-primary)]" style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {stages.map((s: any) => (
                      <div key={s.id} className={`rounded-xl border px-3 py-2 text-xs ${COMPLETED.has(s.status) ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : ["sent_to_client","delivered","admin_review"].includes(s.status) ? "border-amber-400 bg-amber-400/10 text-amber-600" : "border-border text-muted-foreground"}`}>
                        <div className="font-semibold capitalize">{s.stage}</div>
                        <div className="text-[10px]">{s.status.replace(/_/g, " ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
          {(!data || data.length === 0) && (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">No projects yet.</div>
          )}
        </div>
      </DashboardShell>
    );
  },
});
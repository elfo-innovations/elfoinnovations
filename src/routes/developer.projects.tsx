import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

const STAGE_ORDER = ["frontend", "backend", "database", "hosting"] as const;

export const Route = createFileRoute("/developer/projects")({
  component: () => {
    const { user } = useAuth();
    const { data } = useQuery({
      queryKey: ["dev-projects", user?.id],
      enabled: !!user,
      queryFn: async () => {
        const { data: dev } = await supabase.from("developers").select("id").eq("user_id", user!.id).maybeSingle();
        if (!dev) return [];
        return (await supabase.from("projects").select("*, project_stages(*)").eq("developer_id", dev.id).order("created_at", { ascending: false })).data ?? [];
      },
    });
    return (
      <DashboardShell role="developer">
        <h1 className="font-display text-3xl font-bold tracking-tight">My projects</h1>
        <div className="mt-6 space-y-3">
          {(data ?? []).map((p: any) => {
            const stages = [...(p.project_stages ?? [])].sort(
              (a: any, b: any) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
            );
            return (
              <Link key={p.id} to="/developer/project/$id" params={{ id: p.id }} className="glass-card block rounded-2xl p-5 transition hover:border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-primary">{p.project_code}</div>
                    <div className="mt-1 font-semibold">{p.name}</div>
                  </div>
                  <Badge>{p.status}</Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {stages.map((s: any) => (
                    <div key={s.id} className="rounded-lg border px-3 py-2 text-xs">
                      <div className="font-semibold capitalize">{s.stage}</div>
                      <div className="text-[10px] text-muted-foreground">{s.status.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </Link>

            );
          })}
          {(!data || data.length === 0) && (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">No projects assigned yet.</div>
          )}
        </div>
      </DashboardShell>
    );
  },
});

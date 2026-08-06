import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell, StatCard } from "@/components/dashboard/DashboardShell";
import { Briefcase, CheckCircle2, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const COMPLETED = new Set(["admin_approved", "sent_to_client", "client_approved"]);

export const Route = createFileRoute("/developer/")({
  head: () => ({ meta: [{ title: "Developer — ELFO INNOVATIONS" }] }),
  component: DeveloperOverview,
});

function DeveloperOverview() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["me-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: stats } = useQuery({
    queryKey: ["dev-overview", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: dev } = await supabase.from("developers").select("id").eq("user_id", user!.id).maybeSingle();
      if (!dev) return { active: 0, completedStages: 0 };
      const { data: projects } = await supabase.from("projects").select("id, project_stages(status)").eq("developer_id", dev.id);
      const rows = projects ?? [];
      const completedStages = rows.reduce(
        (n: number, p: any) => n + ((p.project_stages ?? []).filter((s: any) => COMPLETED.has(s.status)).length),
        0,
      );
      return { active: rows.length, completedStages };
    },
  });
  const name = (profile?.full_name || user?.email?.split("@")[0] || "there").trim();
  return (
    <DashboardShell role="developer">
      <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your assigned work at a glance.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active projects" value={stats?.active ?? "…"} icon={Briefcase} />
        <StatCard label="Completed stages" value={stats?.completedStages ?? "…"} icon={CheckCircle2} />
        <StatCard label="Messages" value="—" icon={MessagesSquare} />
      </div>
      <div className="glass-card mt-8 rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Your stages</h2>
        <p className="mt-2 text-sm text-muted-foreground">Only stages assigned to you appear here. Update progress and mark stages ready for admin review.</p>
      </div>
    </DashboardShell>
  );
}

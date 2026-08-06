import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MessagesSquare } from "lucide-react";

function MessagesPlaceholder({ role }: { role: "developer" | "client" }) {
  return (
    <DashboardShell role={role}>
      <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
      <div className="glass-card mt-6 flex flex-col items-center justify-center rounded-2xl p-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary electric-glow"><MessagesSquare className="h-7 w-7" /></div>
        <h2 className="mt-4 font-display text-xl font-bold">Real-time messaging</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Chat directly with your {role === "client" ? "assigned team" : "clients"}. Messages appear here as conversations start.
        </p>
      </div>
    </DashboardShell>
  );
}

export const Route = createFileRoute("/developer/messages")({
  component: () => <MessagesPlaceholder role="developer" />,
});

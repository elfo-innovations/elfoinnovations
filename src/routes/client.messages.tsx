import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/client/messages")({
  component: () => (
    <DashboardShell role="client">
      <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
      <div className="glass-card mt-6 flex flex-col items-center justify-center rounded-2xl p-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary electric-glow"><MessagesSquare className="h-7 w-7" /></div>
        <h2 className="mt-4 font-display text-xl font-bold">Real-time chat with your team</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">Conversations appear here as your project kicks off.</p>
      </div>
    </DashboardShell>
  ),
});

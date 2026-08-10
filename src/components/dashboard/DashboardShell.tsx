import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, Briefcase, Code2, MessagesSquare, LogOut, FileText, UserCircle2, FolderKanban, Menu, Receipt, Settings, Info, Globe, Newspaper, Lock, Star, Heart, UserPlus, Home } from "lucide-react";
import { ElfoLogo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatWidget } from "@/components/messaging/ChatWidget";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PushNotificationsBoot } from "@/hooks/use-push-notifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFollowUs } from "@/hooks/use-follow-us";

function FollowUsButton() {
  const { open } = useFollowUs();
  return (
    <Button variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex" onClick={open}>
      <Heart className="mr-1.5 h-4 w-4" /> Follow Us
    </Button>
  );
}

type Nav = { to: string; label: string; icon: any };

const NAVS: Record<"admin" | "developer" | "client", Nav[]> = {
  admin: [
    { to: "/", label: "Back To Home", icon: Home },
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/leads", label: "Leads", icon: FileText },
    { to: "/admin/clients", label: "Clients", icon: Users },
    { to: "/admin/developers", label: "Developers", icon: Code2 },
    { to: "/admin/developer-requests", label: "Developer Requests", icon: UserPlus },

    { to: "/admin/projects", label: "Projects", icon: FolderKanban },
    { to: "/admin/invoices", label: "Invoices", icon: Receipt },
    { to: "/admin/reviews", label: "Reviews", icon: Star },
    { to: "/admin/web-portal", label: "Web Portal", icon: Globe },
    { to: "/admin/blogs", label: "Blogs", icon: Newspaper },
    { to: "/profile", label: "My Profile", icon: Settings },
  ],
  developer: [
    { to: "/", label: "Back To Home", icon: Home },
    { to: "/developer", label: "Overview", icon: LayoutDashboard },
    { to: "/developer/projects", label: "My Projects", icon: Briefcase },
    { to: "/developer/messages", label: "Messages", icon: MessagesSquare },
    { to: "/profile", label: "My Profile", icon: Settings },
  ],
  client: [
    { to: "/", label: "Back To Home", icon: Home },
    { to: "/client", label: "Overview", icon: LayoutDashboard },
    { to: "/client/projects", label: "My Projects", icon: Briefcase },
    { to: "/client/important-info", label: "Important Info", icon: Info },
    { to: "/client/invoices", label: "Invoices", icon: Receipt },
    { to: "/client/messages", label: "Messages", icon: MessagesSquare },
    { to: "/client/reviews", label: "Reviews", icon: Star },
    { to: "/profile", label: "My Profile", icon: Settings },


  ],

};

function NavList({ role, nav, pathname, onNavigate, onSignOut, email }: { role: string; nav: Nav[]; pathname: string; onNavigate?: () => void; onSignOut: () => void; email?: string | null; }) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <>
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{role} portal</div>
        {nav.map((n) => {
          const active = n.to === "/" ? pathname === "/" : pathname === n.to || (n.to !== `/${role}` && pathname.startsWith(n.to));
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t p-3">
        {email && (
          <div className="rounded-xl border bg-muted/40 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signed in as</div>
            <div className="truncate text-sm font-semibold text-foreground">{email}</div>
            <div className="text-[11px] font-medium text-primary">{roleLabel}</div>
          </div>
        )}
        <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </>
  );
}

export function DashboardShell({ role, children }: { role: "admin" | "developer" | "client"; children: ReactNode }) {
  const { user, loading, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const hasAccess = roles.includes(role) || roles.includes("admin");
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account doesn't have {role} access yet.</p>
          <Button className="mt-6 rounded-full" onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  const nav = NAVS[role];
  return <ShellInner role={role} nav={nav} user={user} location={location} navigate={navigate} signOut={signOut} roles={roles} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}>{children}</ShellInner>;
}

function ShellInner({ role, nav, user, location, navigate, signOut, roles, mobileOpen, setMobileOpen, children }: any) {
  // Only clients can be "closed" — admin bypasses.
  const { data: clientRow } = useQuery({
    queryKey: ["me-client-closed", user.id],
    enabled: role === "client" && !roles.includes("admin"),
    queryFn: async () => (await supabase.from("clients").select("closed_at").eq("user_id", user.id).maybeSingle()).data,
  });
  if (role === "client" && !roles.includes("admin") && clientRow?.closed_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-7 w-7" /></div>
          <h1 className="font-display text-2xl font-bold">Portal closed</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your project has been delivered and this client portal has been closed by Elfo Innovations. Please contact us if you need access again.</p>
          <Button className="mt-6 rounded-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>Sign out</Button>
        </div>
      </div>
    );
  }
  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/40 backdrop-blur lg:flex">
        <div className="border-b px-6 py-5"><Link to="/"><ElfoLogo /></Link></div>
        <NavList role={role} nav={nav} pathname={location.pathname} onSignOut={handleSignOut} email={user.email} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-2 border-b bg-background/60 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col p-0">
                <div className="border-b px-6 py-5"><Link to="/" onClick={() => setMobileOpen(false)}><ElfoLogo /></Link></div>
                <NavList role={role} nav={nav} pathname={location.pathname} onNavigate={() => setMobileOpen(false)} onSignOut={handleSignOut} email={user.email} />
              </SheetContent>
            </Sheet>
            <div className="lg:hidden"><ElfoLogo /></div>
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground lg:inline">{role} portal</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {(role === "client" || role === "developer") && <FollowUsButton />}
            <NotificationBell />
            <LanguageSwitcher compact scope={role} />
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 sm:flex">
              <UserCircle2 className="h-4 w-4 text-primary" />
              <span className="max-w-[160px] truncate text-xs font-medium">{user.email}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <ChatWidget role={role} />
      <PushNotificationsBoot />
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string | number; hint?: string; icon: any }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

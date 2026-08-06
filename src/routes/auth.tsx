import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ElfoLogo } from "@/components/brand/Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ELFO INNOVATIONS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user!.id);
    const roles = (roleRows ?? []).map((r) => r.role);
    setBusy(false);
    toast.success("Welcome back");
    if (roles.includes("admin")) navigate({ to: "/admin" });
    else if (roles.includes("developer")) navigate({ to: "/developer" });
    else navigate({ to: "/client" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-hero-radial px-4">
      <div className="absolute inset-0 -z-10 opacity-30 circuit-pattern" />
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center"><ElfoLogo /></Link>
        <div className="glass-card rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">Access your <span className="electric-text">ELFO</span> portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with the credentials provided by your ELFO account manager.</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signIn()}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={signIn} disabled={busy} className="w-full rounded-full electric-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Don't have an account yet? <Link to="/" className="text-primary hover:underline">Start a project inquiry</Link> and we'll set one up for you.
            </p>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

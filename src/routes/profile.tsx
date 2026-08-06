import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, Eye, EyeOff, UserCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { updateMyPassword } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — ELFO" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const changePw = useServerFn(updateMyPassword);
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const role = roles.includes("admin") ? "admin" : roles.includes("developer") ? "developer" : "client";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
      setFullName(data?.full_name || "");
      setPhone(data?.phone || "");
      setCompany(data?.company || "");
      setCountry(data?.country || "");
      setAvatarUrl(data?.avatar_url || null);
    })();
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim(), phone: phone.trim() || null, company: company.trim() || null, country: country.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl || path;
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  const changePassword = async () => {
    if (password.length < 8) return toast.error("Min 8 characters");
    setBusy(true);
    try {
      await changePw({ data: { password } });
      toast.success("Password updated");
      setPassword("");
    } catch (e: any) { toast.error(e?.message || "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <DashboardShell role={role}>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">My Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Update your information, avatar, and password.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-muted">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserCircle2 className="h-12 w-12 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full">
                {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
                Change photo
              </Button>
              <div className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">{role}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <Button onClick={saveProfile} disabled={busy} className="electric-glow">Save changes</Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold">Change password</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose a strong password of at least 8 characters.</p>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-1.5">
              <Label>New password</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={changePassword} disabled={busy || password.length < 8} className="electric-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

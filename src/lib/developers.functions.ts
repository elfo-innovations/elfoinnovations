import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CreateDeveloperInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  skills?: string[];
  status?: "available" | "busy" | "on_leave";
  bio?: string | null;
};

export const createDeveloperWithLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateDeveloperInput) => input)
  .handler(async ({ data, context }) => {
    // Verify caller is admin
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create auth user (email confirmed so they can sign in immediately)
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (cErr || !created.user) throw new Error(cErr?.message || "Failed to create user");

    const uid = created.user.id;

    // Assign developer role
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: "developer" });
    if (rErr) throw new Error(rErr.message);

    // Insert developers row linked to auth user
    const { data: dev, error: dErr } = await supabaseAdmin
      .from("developers")
      .insert({
        user_id: uid,
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        skills: data.skills ?? [],
        status: data.status ?? "available",
        bio: data.bio?.trim() || null,
      })
      .select()
      .single();
    if (dErr) throw new Error(dErr.message);

    return { developer: dev, email: data.email.trim().toLowerCase() };
  });

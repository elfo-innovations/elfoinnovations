import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDeveloperAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { developer_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dev } = await supabaseAdmin.from("developers").select("user_id").eq("id", data.developer_id).maybeSingle();
    await supabaseAdmin.from("developers").delete().eq("id", data.developer_id);
    if (dev?.user_id) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", dev.user_id);
      await supabaseAdmin.auth.admin.deleteUser(dev.user_id).catch(() => null);
    }
    return { ok: true };
  });

export const deleteClientAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { client_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cli } = await supabaseAdmin.from("clients").select("user_id").eq("id", data.client_id).maybeSingle();
    await supabaseAdmin.from("clients").delete().eq("id", data.client_id);
    if (cli?.user_id) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", cli.user_id);
      await supabaseAdmin.auth.admin.deleteUser(cli.user_id).catch(() => null);
    }
    return { ok: true };
  });

// Admin resets a user's password by target user_id. Used for both clients and developers.
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { target_user_id: string; new_password: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    if (!data.new_password || data.new_password.length < 10) throw new Error("Password must be at least 10 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.target_user_id, { password: data.new_password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateMyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data, context }) => {
    if (!data.password || data.password.length < 8)
      throw new Error("Password must be at least 8 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDeveloperAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { developer_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dev } = await supabaseAdmin
      .from("developers")
      .select("user_id")
      .eq("id", data.developer_id)
      .maybeSingle();
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
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cli } = await supabaseAdmin
      .from("clients")
      .select("user_id")
      .eq("id", data.client_id)
      .maybeSingle();
    await supabaseAdmin.from("clients").delete().eq("id", data.client_id);
    if (cli?.user_id) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", cli.user_id);
      await supabaseAdmin.auth.admin.deleteUser(cli.user_id).catch(() => null);
    }
    return { ok: true };
  });

// Admin manually shares/resends login credentials to a given email address (editable at send time).
// Used by the "Share" button in the credentials modal for both clients and developers.
export const shareCredentialsEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string; name: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const to = data.to.trim().toLowerCase();
    if (!to) throw new Error("Email is required");

    const { sendEmail } = await import("@/lib/email.server");
    const portalUrl = process.env["PORTAL_URL"] || "https://elfoinnovations.com";
    const result = await sendEmail({
      to,
      subject: "Your ELFO Innovations portal login",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2>Hi ${data.name || ""},</h2>
          <p>Here are your ELFO Innovations portal login details:</p>
          <p><b>Portal:</b> <a href="${portalUrl}/auth">${portalUrl}/auth</a><br/>
             <b>Email:</b> ${to}<br/>
             <b>Password:</b> ${data.password}</p>
          <p>We recommend changing your password after logging in.</p>
          <p>— ELFO Innovations</p>
        </div>`,
    });
    if (!result?.sent) throw new Error("Email failed to send. Check email configuration.");
    return { ok: true };
  });

// Admin resets a user's password by target user_id. Used for both clients and developers.
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { target_user_id: string; new_password: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    if (!data.new_password || data.new_password.length < 10)
      throw new Error("Password must be at least 10 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.target_user_id, {
      password: data.new_password,
    });
    if (error) throw new Error(error.message);

    // Note: notification email is no longer sent automatically here.
    // Admin explicitly triggers it via the "Share" button in the reset-password modal.

    return { ok: true };
  });

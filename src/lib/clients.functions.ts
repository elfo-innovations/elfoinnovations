import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CreateClientInput = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  notes?: string | null;
  source_lead_id?: string | null;
};

export const createClientWithLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateClientInput) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name.trim() },
    });
    if (cErr || !created.user) throw new Error(cErr?.message || "Failed to create user");

    const uid = created.user.id;

    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "client" });
    if (rErr) throw new Error(rErr.message);

    const { data: client, error: clientErr } = await supabaseAdmin
      .from("clients")
      .insert({
        user_id: uid,
        full_name: data.full_name.trim(),
        email,
        phone: data.phone?.trim() || null,
        company: data.company?.trim() || null,
        country: data.country?.trim() || null,
        notes: data.notes?.trim() || null,
        source_lead_id: data.source_lead_id || null,
      })
      .select()
      .single();
    if (clientErr) throw new Error(clientErr.message);

    if (data.source_lead_id) {
      await supabaseAdmin
        .from("leads")
        .update({ status: "converted", converted_client_id: client.id })
        .eq("id", data.source_lead_id);
    }

    // Send onboarding credentials via Resend (no-reply@elfoinnovations.com)
    const { sendEmail } = await import("@/lib/email.server");
    const portalUrl = process.env["PORTAL_URL"] || "https://elfoinnovations.com";
    await sendEmail({
      to: email,
      subject: "Your ELFO Innovations client portal login",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2>Welcome to ELFO Innovations, ${data.full_name.trim()}</h2>
          <p>Your client portal account has been created. Use these details to log in:</p>
          <p><b>Portal:</b> <a href="${portalUrl}/auth">${portalUrl}/auth</a><br/>
             <b>Email:</b> ${email}<br/>
             <b>Password:</b> ${data.password}</p>
          <p>We recommend changing your password after first login.</p>
          <p>— ELFO Innovations</p>
        </div>`,
    }).catch((e) => console.error("[onboarding email] failed", e));

    return { client, email };
  });
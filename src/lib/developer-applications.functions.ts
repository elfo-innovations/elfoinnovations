import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateApplication, normalizeUrl, type ApplicationInput } from "@/lib/application-validation";

type DecisionInput = {
  id: string;
  subject: string;
  message: string;
  username?: string;
  password?: string;
  loginUrl?: string;
};

export const submitDeveloperApplication = createServerFn({ method: "POST" })
  .inputValidator((input: ApplicationInput) => input)
  .handler(async ({ data }) => {
    const errors = validateApplication(data);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { applicationReceivedEmail } = await import("@/lib/email-templates");
    const { sendEmail } = await import("@/lib/email.server");

    const email = data.email.trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("developer_applications")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing) throw new Error("An application with this email address has already been submitted.");

    const { error } = await supabaseAdmin.from("developer_applications").insert({
      full_name: data.full_name.trim(),
      email,
      phone: data.phone.trim(),
      country: data.country.trim(),
      city: data.city.trim(),
      github_url: normalizeUrl(data.github_url),
      linkedin_url: data.linkedin_url?.trim() ? normalizeUrl(data.linkedin_url) : null,
      portfolio_url: data.portfolio_url?.trim() ? normalizeUrl(data.portfolio_url) : null,
      primary_role: data.primary_role,
      skills: data.skills,
      years_experience: data.years_experience,
      current_status: data.current_status,
      bio: data.bio.trim(),
      motivation: data.motivation.trim(),
      resume_path: data.resume_path || null,
      resume_name: data.resume_name || null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("An application with this email address has already been submitted.");
      throw new Error(error.message);
    }

    const mail = await sendEmail({
      to: email,
      subject: "We received your application — ELFO Innovations",
      html: applicationReceivedEmail({ name: data.full_name.trim(), role: data.primary_role }),
    });

    return { ok: true, emailSent: mail.sent, emailError: mail.error ?? null };
  });

export const approveDeveloperApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: DecisionInput) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin only");
    if (!data.password || data.password.length < 8) throw new Error("Temporary password must be at least 8 characters");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { acceptanceEmail } = await import("@/lib/email-templates");
    const { sendEmail } = await import("@/lib/email.server");

    const { data: app, error: appErr } = await supabaseAdmin
      .from("developer_applications")
      .select("*")
      .eq("id", data.id)
      .single();
    if (appErr || !app) throw new Error(appErr?.message || "Application not found");

    const email = app.email.trim().toLowerCase();
    const username = data.username?.trim() || email.split("@")[0];

    // Create the auth user if it does not exist yet.
    let uid: string | null = null;
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: app.full_name, username },
    });
    if (created?.user) {
      uid = created.user.id;
    } else if (cErr && /already/i.test(cErr.message)) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users.find((u) => u.email?.toLowerCase() === email);
      if (!found) throw new Error("User already exists but could not be located");
      uid = found.id;
      await supabaseAdmin.auth.admin.updateUserById(uid, { password: data.password, email_confirm: true });
    } else {
      throw new Error(cErr?.message || "Failed to create developer account");
    }

    // Role
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", uid)
      .eq("role", "developer")
      .maybeSingle();
    if (!roleRow) {
      const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "developer" });
      if (rErr) throw new Error(rErr.message);
    }

    // Developer profile row
    const { data: devRow } = await supabaseAdmin.from("developers").select("id").eq("email", email).maybeSingle();
    if (!devRow) {
      const { error: dErr } = await supabaseAdmin.from("developers").insert({
        user_id: uid,
        full_name: app.full_name,
        email,
        phone: app.phone,
        skills: app.skills ?? [],
        status: "available",
        bio: app.bio,
      });
      if (dErr) throw new Error(dErr.message);
    } else {
      await supabaseAdmin.from("developers").update({ user_id: uid }).eq("id", devRow.id);
    }

    const { error: uErr } = await supabaseAdmin
      .from("developer_applications")
      .update({
        status: "accepted",
        decision_subject: data.subject,
        decision_message: data.message,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        created_user_id: uid,
      })
      .eq("id", data.id);
    if (uErr) throw new Error(uErr.message);

    const loginUrl = data.loginUrl || "https://elfoinnovation.lovable.app/auth";
    const mail = await sendEmail({
      to: email,
      subject: data.subject || "Welcome to Elfo Innovations",
      html: acceptanceEmail({
        name: app.full_name,
        message: data.message,
        loginUrl,
        username,
        email,
        password: data.password,
      }),
    });

    return { ok: true, emailSent: mail.sent, emailError: mail.error ?? null, email, username, password: data.password };
  });

export const rejectDeveloperApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: DecisionInput) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { rejectionEmail } = await import("@/lib/email-templates");
    const { sendEmail } = await import("@/lib/email.server");

    const { data: app, error: appErr } = await supabaseAdmin
      .from("developer_applications")
      .select("*")
      .eq("id", data.id)
      .single();
    if (appErr || !app) throw new Error(appErr?.message || "Application not found");

    const { error: uErr } = await supabaseAdmin
      .from("developer_applications")
      .update({
        status: "rejected",
        decision_subject: data.subject,
        decision_message: data.message,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (uErr) throw new Error(uErr.message);

    const mail = await sendEmail({
      to: app.email,
      subject: data.subject || "Update on your application — ELFO Innovations",
      html: rejectionEmail({ name: app.full_name, message: data.message }),
    });

    return { ok: true, emailSent: mail.sent, emailError: mail.error ?? null };
  });

export const getResumeDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("developer-resumes")
      .createSignedUrl(data.path, 300);
    if (error || !signed) throw new Error(error?.message || "Could not create download link");
    return { url: signed.signedUrl };
  });

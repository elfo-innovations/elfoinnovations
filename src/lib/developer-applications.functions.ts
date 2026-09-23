import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  validateApplication,
  normalizeUrl,
  RESUME_MAX_BYTES,
  type ApplicationInput,
} from "@/lib/application-validation";
import { verifyTurnstileToken } from "@/lib/turnstile-verify.server";

const PDF_MAGIC = "%PDF-";

/**
 * Decodes, validates and uploads a base64-encoded resume to the private
 * developer-resumes bucket using the service-role client. This only ever
 * runs after Turnstile verification has succeeded, so it's the sole path
 * that can write to this bucket — the browser has no direct Storage
 * upload permission (see the accompanying migration removing the old
 * anon/authenticated INSERT policy).
 */
async function uploadResumeServerSide(resumeBase64: string): Promise<string> {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(resumeBase64, "base64");
  } catch {
    throw new Error("Resume file could not be read. Please try again.");
  }
  if (bytes.length === 0) throw new Error("Resume file appears to be empty.");
  if (bytes.length > RESUME_MAX_BYTES) throw new Error("Resume must be under 5MB.");
  if (bytes.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    throw new Error("Resume must be a valid PDF file.");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const path = `applications/${crypto.randomUUID()}.pdf`;
  const { error } = await supabaseAdmin.storage
    .from("developer-resumes")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (error) throw new Error(`Resume upload failed: ${error.message}`);
  return path;
}

type ApplicationSubmitInput = ApplicationInput & {
  turnstileToken: string;
  resume_base64?: string | null;
};

type DecisionInput = {
  id: string;
  subject: string;
  message: string;
  username?: string;
  password?: string;
  loginUrl?: string;
};

export const submitDeveloperApplication = createServerFn({ method: "POST" })
  .inputValidator((input: ApplicationSubmitInput) => input)
  .handler(async ({ data }) => {
    const errors = validateApplication(data);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);

    // Finding 12: verify Turnstile before touching the DB. Data shape and
    // validation above are unchanged from before this fix.
    await verifyTurnstileToken(data.turnstileToken);

    // Resume upload happens here, server-side, only after the Turnstile
    // check above has passed — the browser is never granted direct write
    // access to the developer-resumes bucket.
    const resume_path = data.resume_base64
      ? await uploadResumeServerSide(data.resume_base64)
      : null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { applicationReceivedEmail } = await import("@/lib/email-templates");
    const { sendEmail } = await import("@/lib/email.server");

    const email = data.email.trim().toLowerCase();

    const { data: existing } = await supabaseAdmin
      .from("developer_applications")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing)
      throw new Error("An application with this email address has already been submitted.");

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
      resume_path,
      resume_name: data.resume_name || null,
    });
    if (error) {
      if (error.code === "23505")
        throw new Error("An application with this email address has already been submitted.");
      throw new Error(error.message);
    }

    const mail = await sendEmail({
      to: email,
      subject: "We received your application — ELFO Innovations",
      html: applicationReceivedEmail({ name: data.full_name.trim(), role: data.primary_role }),
    });

    // Notify admin inbox. Must be awaited — in the edge runtime an
    // un-awaited fire-and-forget call can be killed as soon as the
    // handler returns, which was silently dropping this email.
    const adminTo = process.env["ADMIN_NOTIFY_EMAIL"] || "support@elfoinnovations.com";
    const adminMail = await sendEmail({
      to: adminTo,
      replyTo: email,
      subject: `New developer application — ${data.full_name.trim()} (${data.primary_role})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2>New developer application: ${data.full_name.trim()}</h2>
          <p><b>Email:</b> ${email}<br/>
             <b>Phone:</b> ${data.phone.trim()}<br/>
             <b>Location:</b> ${data.city.trim()}, ${data.country.trim()}<br/>
             <b>Role:</b> ${data.primary_role}<br/>
             <b>Experience:</b> ${data.years_experience}<br/>
             <b>Status:</b> ${data.current_status}<br/>
             <b>Skills:</b> ${data.skills.join(", ")}<br/>
             <b>GitHub:</b> ${normalizeUrl(data.github_url)}${data.linkedin_url?.trim() ? `<br/><b>LinkedIn:</b> ${normalizeUrl(data.linkedin_url)}` : ""}${data.portfolio_url?.trim() ? `<br/><b>Portfolio:</b> ${normalizeUrl(data.portfolio_url)}` : ""}</p>
          <p><b>Bio:</b><br/>${data.bio.trim()}</p>
          <p><b>Motivation:</b><br/>${data.motivation.trim()}</p>
          <p style="color:#888;font-size:12px">Reply to this email to respond directly to the applicant. Review in the admin dashboard to accept or reject.</p>
        </div>`,
    }).catch((e) => {
      console.error("[dev application notify] failed", e);
      return { sent: false, provider: "error", error: String(e) };
    });
    if (!adminMail.sent) {
      console.error("[dev application] admin notify email not sent:", adminMail.error);
    }

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
    if (!data.password || data.password.length < 8)
      throw new Error("Temporary password must be at least 8 characters");

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
      await supabaseAdmin.auth.admin.updateUserById(uid, {
        password: data.password,
        email_confirm: true,
      });
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
      const { error: rErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: uid, role: "developer" });
      if (rErr) throw new Error(rErr.message);
    }

    // Developer profile row
    const { data: devRow } = await supabaseAdmin
      .from("developers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
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

    const loginUrl = data.loginUrl || "https://elfoinnovations.com/auth";
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

    return {
      ok: true,
      emailSent: mail.sent,
      emailError: mail.error ?? null,
      email,
      username,
      password: data.password,
    };
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
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("developer-resumes")
      .createSignedUrl(data.path, 300);
    if (error || !signed) throw new Error(error?.message || "Could not create download link");
    return { url: signed.signedUrl };
  });

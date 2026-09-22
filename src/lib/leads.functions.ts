import { createServerFn } from "@tanstack/react-start";
import { verifyTurnstileToken } from "@/lib/turnstile-verify.server";

export type LeadSubmitInput = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  country_code: string;
  company: string | null;
  project_description: string;
  budget_readiness: "yes_approved" | "maybe_depends" | "not_yet_exploring";
  estimated_budget: string | null;
  timeline: string | null;
  preferred_contact: string;
  turnstileToken: string;
};

// No Claude/user auth required — this is the public inquiry form. Turnstile
// verification (Finding 12) is what stands in front of it instead. Was
// previously a direct `supabase.from("leads").insert()` call from the
// client (anon RLS `WITH CHECK (true)`); moved server-side so the Turnstile
// check can gate the insert before it happens, in the style of
// src/lib/clients.functions.ts / developer-applications.functions.ts.
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: LeadSubmitInput) => input)
  .handler(async ({ data }) => {
    await verifyTurnstileToken(data.turnstileToken);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalizedEmail = data.email.trim().toLowerCase();
    const normalizedPhone = data.phone.replace(/\s+/g, "");

    const [{ data: emailHit }, { data: phoneHit }] = await Promise.all([
      supabaseAdmin
        .from("leads")
        .select("id")
        .ilike("email", normalizedEmail)
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from("leads").select("id").eq("phone", normalizedPhone).limit(1).maybeSingle(),
    ]);
    if (emailHit) throw new Error("A user with this email address has already been registered");
    if (phoneHit) throw new Error("A user with this phone number has already been registered");

    const leadCode = `ELFO-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const { error } = await supabaseAdmin.from("leads").insert({
      lead_code: leadCode,
      full_name: data.full_name.trim(),
      email: normalizedEmail,
      phone: data.phone,
      country: data.country,
      country_code: data.country_code,
      company: data.company?.trim() || null,
      project_description: data.project_description.trim(),
      budget_readiness: data.budget_readiness,
      estimated_budget: data.estimated_budget || null,
      timeline: data.timeline || null,
      preferred_contact: data.preferred_contact,
    });
    if (error) {
      if (/duplicate|unique|already/i.test(error.message)) {
        throw new Error("A user with this email address has already been registered");
      }
      throw new Error(error.message);
    }

    return { leadCode };
  });

// Shared validation for the developer application (used on client and server).

export const PRIMARY_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer",
  "AI / ML Engineer",
  "DevOps Engineer",
  "UI / UX Designer",
  "Other",
] as const;

export const EXPERIENCE_OPTIONS = [
  "0-1 years",
  "1-2 years",
  "2-4 years",
  "4-6 years",
  "6-10 years",
  "10+ years",
] as const;

export const CURRENT_STATUS_OPTIONS = [
  "Student",
  "Fresh Graduate",
  "Employed Full-Time",
  "Employed Part-Time",
  "Freelancer",
  "Available Immediately",
] as const;

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export type ApplicationInput = {
  full_name: string;
  email: string;
  phone: string;
  github_url: string;
  portfolio_url?: string;
  primary_role: string;
  skills: string[];
  current_status: string;
  bio: string;
  motivation: string;
  resume_path?: string | null;
  resume_name?: string | null;
  resume_size?: number | null;
  // Base64-encoded resume bytes (no data: URL prefix), sent to the server so
  // the upload can happen only after Turnstile + validation succeed there.
  resume_base64?: string | null;
  agreed: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
// Digits only (with an optional leading +); any letter fails this immediately.
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{6,19}$/;
const PHONE_ALPHA_RE = /[a-zA-Z]/;

function urlHost(value: string): string | null {
  try {
    const u = new URL(value.startsWith("http") ? value : `https://${value}`);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normalizeUrl(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Returns a map of field -> error message. Empty object means valid. */
export function validateApplication(v: ApplicationInput): Record<string, string> {
  const e: Record<string, string> = {};
  const req = (k: keyof ApplicationInput, label: string) => {
    const val = v[k];
    if (typeof val !== "string" || !val.trim()) e[k as string] = `${label} is required`;
  };

  req("full_name", "Full name");
  if (v.full_name?.trim() && v.full_name.trim().length < 3)
    e.full_name = "Please enter your full name";

  if (!v.email?.trim()) e.email = "Email address is required";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address";

  if (!v.phone?.trim()) e.phone = "Phone number is required";
  else if (PHONE_ALPHA_RE.test(v.phone)) e.phone = "Phone number can't contain letters";
  else if (!PHONE_RE.test(v.phone.trim()))
    e.phone = "Enter a valid phone number (digits, optional +)";

  if (!v.github_url?.trim()) e.github_url = "GitHub profile is required";
  else {
    const h = urlHost(v.github_url);
    if (!h) e.github_url = "Enter a valid URL";
    else if (h !== "github.com") e.github_url = "Must be a github.com profile URL";
  }

  if (!v.portfolio_url?.trim()) e.portfolio_url = "Portfolio URL is required";
  else if (!urlHost(v.portfolio_url)) e.portfolio_url = "Enter a valid URL";

  if (!v.primary_role?.trim()) e.primary_role = "Select your primary role";
  if (!v.skills || v.skills.length === 0) e.skills = "Add at least one skill";
  if (!v.current_status?.trim()) e.current_status = "Select your current status";

  if (!v.bio?.trim()) e.bio = "Short bio is required";
  else if (v.bio.trim().length < 40) e.bio = "Please write at least 40 characters";
  else if (v.bio.trim().length > 1000) e.bio = "Keep this under 1000 characters";

  if (!v.motivation?.trim()) e.motivation = "This field is required";
  else if (v.motivation.trim().length < 40) e.motivation = "Please write at least 40 characters";
  else if (v.motivation.trim().length > 1000) e.motivation = "Keep this under 1000 characters";

  if (!v.resume_name?.trim()) e.resume = "Resume is required";
  else if (!/\.pdf$/i.test(v.resume_name)) e.resume = "Resume must be a PDF file";
  if (typeof v.resume_size === "number" && v.resume_size > RESUME_MAX_BYTES)
    e.resume = "Resume must be under 5MB";

  if (!v.agreed) e.agreed = "You must accept the agreement";

  return e;
}

export function usernameFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return base || "developer";
}

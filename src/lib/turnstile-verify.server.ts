// Server-only. Verifies a Cloudflare Turnstile token against Cloudflare's
// siteverify endpoint before allowing an unauthenticated public-form insert
// to proceed (Finding 12). Never import this from client code — it reads
// TURNSTILE_SECRET_KEY, which must stay a Cloudflare Secret and is never
// exposed to the browser.

type SiteverifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string | null | undefined): Promise<void> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) {
    // Fail closed: if the secret isn't configured, a form that's supposed to
    // be gated must not silently accept submissions unchecked.
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not set — rejecting submission");
    throw new Error("Verification is temporarily unavailable. Please try again shortly.");
  }
  if (!token || typeof token !== "string") {
    throw new Error("Please complete the verification challenge and try again.");
  }

  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    console.error("[turnstile] siteverify HTTP error", res.status);
    throw new Error("Verification failed. Please try again.");
  }
  const result = (await res.json()) as SiteverifyResponse;
  if (!result.success) {
    console.error("[turnstile] verification rejected", result["error-codes"]);
    throw new Error("Verification failed. Please refresh and try again.");
  }
}

import { AwsClient } from "aws4fetch";

/**
 * Server-only Cloudflare R2 helper (S3-compatible API via aws4fetch).
 *
 * IMPORTANT: this file must never be imported from client/browser code.
 * Credentials are read from process.env (same convention as
 * SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, etc. — see wrangler.toml) and
 * are only ever used here, server-side, to sign requests. They are never
 * returned to the caller, logged, or embedded in any response.
 *
 * Scope note: this bucket (`website-media`) only ever holds non-sensitive,
 * publicly-served website/blog media — never treat this helper as a
 * pattern for private/user-scoped files (those stay on Supabase Storage
 * with RLS, e.g. `developer-resumes`, `client-invoices`, `project-files`).
 */

const PUBLIC_BASE_URL = "https://media.elfoinnovations.com";
const BUCKET = "website-media";

function getR2Env() {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];

  const missing = [
    ...(!accountId ? ["R2_ACCOUNT_ID"] : []),
    ...(!accessKeyId ? ["R2_ACCESS_KEY_ID"] : []),
    ...(!secretAccessKey ? ["R2_SECRET_ACCESS_KEY"] : []),
  ];
  if (missing.length) {
    // Deliberately no secret values in this message — only which vars are absent.
    throw new Error(
      `Missing R2 environment variable(s): ${missing.join(", ")}. Check your deployment's environment configuration.`,
    );
  }

  return { accountId: accountId!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! };
}

function getClient(): { client: AwsClient; endpoint: string } {
  const { accountId, accessKeyId, secretAccessKey } = getR2Env();
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  return { client, endpoint };
}

/** Uploads bytes to the shared `website-media` R2 bucket at the given key. */
export async function uploadToR2(
  key: string,
  bytes: Uint8Array | Buffer,
  contentType: string,
): Promise<{ path: string; publicUrl: string }> {
  const { client, endpoint } = getClient();
  const url = `${endpoint}/${BUCKET}/${key}`;
  const res = await client.fetch(url, {
    method: "PUT",
    body: bytes as BodyInit,
    headers: { "Content-Type": contentType },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return { path: key, publicUrl: `${PUBLIC_BASE_URL}/${key}` };
}

/** Deletes an object from the shared `website-media` R2 bucket by key. */
export async function deleteFromR2(key: string): Promise<void> {
  const { client, endpoint } = getClient();
  const url = `${endpoint}/${BUCKET}/${key}`;
  const res = await client.fetch(url, { method: "DELETE" });
  // R2/S3 DELETE is idempotent — 204/404 both mean "gone". Only surface real failures.
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 delete failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

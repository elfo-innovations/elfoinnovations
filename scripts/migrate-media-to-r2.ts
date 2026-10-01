/**
 * scripts/migrate-media-to-r2.ts
 *
 * Copies every object in the Supabase Storage `website-media` bucket to the
 * Cloudflare R2 `website-media` bucket, preserving the exact object key.
 *
 * This script is COPY-ONLY:
 *   - Never deletes or modifies anything in Supabase Storage.
 *   - Never touches the database (media_library, blogs, or any other table).
 *   - Never changes R2 bucket visibility / public access.
 *   - Never touches DNS or custom domain configuration.
 *   - Never rewrites any URLs anywhere.
 *
 * Run with Node 22+ (uses built-in TypeScript stripping, no ts-node/tsx needed):
 *
 *   node --env-file=.env --experimental-strip-types scripts/migrate-media-to-r2.ts [flags]
 *
 * Flags:
 *   --dry-run              List what would happen; never downloads/uploads bytes.
 *   --sample-root=N        Only process the first N root-level objects.
 *   --sample-blog=N        Only process the first N blog-content/* objects.
 *   --verify-only          Skip copying; only HEAD-check R2 vs source sizes for
 *                          objects already recorded as "copied" in the log.
 *   --concurrency=N        Parallel workers (default 5).
 *
 * Required environment variables (read from .env via --env-file, never printed):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (matches src/integrations/supabase/client.server.ts convention)
 *   R2_ACCOUNT_ID               (non-secret; also given as 2aa365acc7f109723236b34673f40510)
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_ENDPOINT                 (optional — derived from R2_ACCOUNT_ID if not set)
 *   R2_BUCKET                   (optional — defaults to "website-media")
 *
 * If your local .env uses different variable names than the ones above, either
 * rename them in .env or adjust the constants in the CONFIG section below —
 * do not hardcode credential values into this file.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const SUPABASE_BUCKET = "website-media";
const R2_BUCKET = process.env.R2_BUCKET || "website-media";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

const LOG_PATH = path.resolve(import.meta.dirname, "migration-log.json");

// ---------------------------------------------------------------------------
// CLI FLAGS
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERIFY_ONLY = args.includes("--verify-only");
const CONCURRENCY = Number(args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 5);
const SAMPLE_ROOT = args.find((a) => a.startsWith("--sample-root="))?.split("=")[1];
const SAMPLE_BLOG = args.find((a) => a.startsWith("--sample-blog="))?.split("=")[1];
const sampleRootN = SAMPLE_ROOT !== undefined ? Number(SAMPLE_ROOT) : undefined;
const sampleBlogN = SAMPLE_BLOG !== undefined ? Number(SAMPLE_BLOG) : undefined;

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface SourceObject {
  key: string; // full storage_path, e.g. "abc.png" or "blog-content/123-x.png"
  size: number;
  mimetype: string | null;
}

type ObjectStatus = "copied" | "skipped-existing" | "failed" | "would-copy" | "would-skip";

interface LogEntry {
  key: string;
  status: ObjectStatus;
  sourceSize?: number;
  uploadedSize?: number;
  sourceMd5?: string;
  contentType?: string;
  error?: string;
  timestamp: string;
}

interface MigrationLog {
  entries: Record<string, LogEntry>;
}

// ---------------------------------------------------------------------------
// STARTUP CHECKS
// ---------------------------------------------------------------------------

function requireEnv() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_ENDPOINT) missing.push("R2_ENDPOINT (or R2_ACCOUNT_ID to derive it)");
  if (missing.length) {
    console.error(
      `[migrate-media-to-r2] Missing required environment variable(s): ${missing.join(", ")}\n` +
        `Set them in .env and run with --env-file=.env. Refusing to start.`,
    );
    process.exit(1);
  }
}

// Never log credential values — only confirm presence.
function logStartupSummary() {
  console.log("=== R2 Media Migration ===");
  console.log(`Source:      Supabase Storage bucket "${SUPABASE_BUCKET}"`);
  console.log(`Destination: R2 bucket "${R2_BUCKET}" @ ${R2_ENDPOINT}`);
  console.log(
    `Mode:        ${DRY_RUN ? "DRY RUN (no bytes will move)" : VERIFY_ONLY ? "VERIFY ONLY" : "LIVE COPY"}`,
  );
  if (sampleRootN !== undefined || sampleBlogN !== undefined) {
    console.log(
      `Sample:      root=${sampleRootN ?? "(all)"} blog-content=${sampleBlogN ?? "(all)"}`,
    );
  }
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Log file:    ${LOG_PATH}`);
  console.log("===========================\n");
}

// ---------------------------------------------------------------------------
// SUPABASE: authoritative object listing (from Storage API itself, not the DB —
// media_library is known to under-report blog-content/* objects; see report)
// ---------------------------------------------------------------------------

async function listAllSourceObjects(supabase: SupabaseClient): Promise<SourceObject[]> {
  const results: SourceObject[] = [];

  async function listFolder(prefix: string) {
    const pageSize = 1000;
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).list(prefix, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Listing "${prefix}" failed: ${error.message}`);
      if (!data || data.length === 0) break;

      for (const entry of data) {
        // Supabase Storage represents subfolders as entries with id === null.
        const isFolder = entry.id === null;
        const fullKey = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (isFolder) {
          await listFolder(fullKey);
        } else {
          results.push({
            key: fullKey,
            size: entry.metadata?.size ?? 0,
            mimetype: entry.metadata?.mimetype ?? null,
          });
        }
      }

      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }

  await listFolder("");
  return results;
}

// ---------------------------------------------------------------------------
// LOG FILE (resumability)
// ---------------------------------------------------------------------------

async function loadLog(): Promise<MigrationLog> {
  try {
    const raw = await readFile(LOG_PATH, "utf-8");
    return JSON.parse(raw) as MigrationLog;
  } catch {
    return { entries: {} };
  }
}

async function saveLog(log: MigrationLog) {
  await mkdir(path.dirname(LOG_PATH), { recursive: true });
  await writeFile(LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
}

function recordEntry(log: MigrationLog, entry: LogEntry) {
  log.entries[entry.key] = entry;
}

// ---------------------------------------------------------------------------
// R2 HELPERS
// ---------------------------------------------------------------------------

function makeS3Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

async function headR2Object(s3: S3Client, key: string): Promise<HeadObjectCommandOutput | null> {
  try {
    return await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name === "NotFound" || name === "NoSuchKey") return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// COPY ONE OBJECT
// ---------------------------------------------------------------------------

async function copyObject(
  supabase: SupabaseClient,
  s3: S3Client,
  obj: SourceObject,
  log: MigrationLog,
): Promise<void> {
  const timestamp = new Date().toISOString();

  try {
    // Skip-if-exists: check R2 first, compare size before doing any download.
    const existing = await headR2Object(s3, obj.key);
    if (existing && existing.ContentLength === obj.size) {
      recordEntry(log, {
        key: obj.key,
        status: DRY_RUN ? "would-skip" : "skipped-existing",
        sourceSize: obj.size,
        uploadedSize: existing.ContentLength,
        contentType: obj.mimetype ?? undefined,
        timestamp,
      });
      console.log(`  SKIP  (already in R2, size matches) ${obj.key}`);
      return;
    }

    if (DRY_RUN) {
      recordEntry(log, {
        key: obj.key,
        status: "would-copy",
        sourceSize: obj.size,
        contentType: obj.mimetype ?? undefined,
        timestamp,
      });
      console.log(
        `  WOULD COPY  ${obj.key}  (${obj.size} bytes, ${obj.mimetype ?? "unknown type"})`,
      );
      return;
    }

    // Download from Supabase Storage.
    const { data: blob, error: downloadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .download(obj.key);
    if (downloadError || !blob) {
      throw new Error(`Supabase download failed: ${downloadError?.message ?? "no data"}`);
    }
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sourceMd5 = createHash("md5").update(buffer).digest("hex");

    // Upload to R2, preserving content type.
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: obj.key,
        Body: buffer,
        ContentType: obj.mimetype ?? blob.type ?? "application/octet-stream",
        ContentLength: buffer.byteLength,
      }),
    );

    // Verify: re-HEAD the R2 object and compare size (and ETag/MD5 when it's a
    // plain, non-multipart upload — R2's ETag is an MD5 hex digest in that case).
    const verify = await headR2Object(s3, obj.key);
    const uploadedSize = verify?.ContentLength;
    const etag = verify?.ETag?.replace(/"/g, "");
    const sizeOk = uploadedSize === buffer.byteLength;
    const md5Ok = !etag || etag.includes("-") /* multipart, skip md5 check */ || etag === sourceMd5;

    if (!sizeOk || !md5Ok) {
      throw new Error(
        `Post-upload verification failed for ${obj.key}: ` +
          `sizeOk=${sizeOk} (expected ${buffer.byteLength}, got ${uploadedSize}), ` +
          `md5Ok=${md5Ok} (expected ${sourceMd5}, got ${etag})`,
      );
    }

    recordEntry(log, {
      key: obj.key,
      status: "copied",
      sourceSize: buffer.byteLength,
      uploadedSize,
      sourceMd5,
      contentType: obj.mimetype ?? undefined,
      timestamp,
    });
    console.log(`  COPIED  ${obj.key}  (${buffer.byteLength} bytes, verified)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordEntry(log, { key: obj.key, status: "failed", error: message, timestamp });
    console.error(`  FAILED  ${obj.key}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// VERIFY-ONLY MODE
// ---------------------------------------------------------------------------

async function verifyOnly(s3: S3Client, sourceObjects: SourceObject[], log: MigrationLog) {
  for (const obj of sourceObjects) {
    const existing = log.entries[obj.key];
    if (!existing || existing.status !== "copied") continue;
    const head = await headR2Object(s3, obj.key);
    const ok = head && head.ContentLength === obj.size;
    console.log(`  ${ok ? "OK" : "MISMATCH"}  ${obj.key}`);
  }
}

// ---------------------------------------------------------------------------
// SIMPLE CONCURRENCY QUEUE
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => next()));
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  requireEnv();
  logStartupSummary();

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const s3 = makeS3Client();

  console.log("Listing authoritative source object list from Supabase Storage...");
  const allObjects = await listAllSourceObjects(supabase);
  const rootObjects = allObjects.filter((o) => !o.key.startsWith("blog-content/"));
  const blogObjects = allObjects.filter((o) => o.key.startsWith("blog-content/"));
  console.log(
    `Found ${allObjects.length} total objects (${rootObjects.length} root-level, ${blogObjects.length} blog-content/*)\n`,
  );

  let targets = allObjects;
  if (sampleRootN !== undefined || sampleBlogN !== undefined) {
    const selectedRoot = rootObjects.slice(0, sampleRootN ?? 0);
    const selectedBlog = blogObjects.slice(0, sampleBlogN ?? 0);
    targets = [...selectedRoot, ...selectedBlog];
    console.log(
      `Sample mode: selected ${selectedRoot.length} root + ${selectedBlog.length} blog-content object(s):`,
    );
    targets.forEach((t) => console.log(`  - ${t.key}`));
    console.log("");
  }

  const log = await loadLog();

  if (VERIFY_ONLY) {
    console.log("Verify-only mode: checking previously copied objects against R2...\n");
    await verifyOnly(s3, targets, log);
    return;
  }

  console.log(`Processing ${targets.length} object(s)...\n`);
  await runWithConcurrency(targets, CONCURRENCY, (obj) => copyObject(supabase, s3, obj, log));

  await saveLog(log);

  const counts = Object.values(log.entries).reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log("\n=== Summary ===");
  for (const [status, count] of Object.entries(counts)) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`Log written to ${LOG_PATH}`);
}

main().catch((err) => {
  console.error("[migrate-media-to-r2] Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});

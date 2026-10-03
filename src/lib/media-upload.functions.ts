import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// 25MB safety cap — generous for website/blog media, matches the kind of
// files this bucket has always held.
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function decodeUpload(file_base64: string) {
  let bytes: Buffer;
  try {
    bytes = Buffer.from(file_base64, "base64");
  } catch {
    throw new Error("File could not be read. Please try again.");
  }
  if (bytes.length === 0) throw new Error("File appears to be empty.");
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("File must be under 25MB.");
  return bytes;
}

type UploadInput = {
  file_base64: string;
  file_name: string;
  file_type: string;
  file_size: number;
};

/**
 * Media Library upload — replaces the old direct Supabase Storage upload.
 * Preserves the exact existing storage_path format (`{uuid}.{ext}`) and the
 * exact media_library row shape; only the storage backend changes.
 */
export const uploadMediaLibraryFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadInput) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const bytes = decodeUpload(data.file_base64);

    const { uploadToR2 } = await import("@/lib/r2.server");
    const ext = data.file_name.split(".").pop() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { publicUrl } = await uploadToR2(
      path,
      bytes,
      data.file_type || "application/octet-stream",
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("media_library").insert({
      file_name: data.file_name,
      storage_path: path,
      public_url: publicUrl,
      file_type: data.file_type,
      file_size: data.file_size,
      folder: "website",
    });
    if (error) throw new Error(`Failed to record upload: ${error.message}`);

    return { publicUrl, path };
  });

/**
 * Deletes a Media Library object that lives in R2 (post-migration uploads
 * only — callers are responsible for routing legacy Supabase-hosted rows
 * to the existing Supabase Storage delete path instead).
 */
export const deleteMediaLibraryR2Object = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { deleteFromR2 } = await import("@/lib/r2.server");
    await deleteFromR2(data.path);
    return { ok: true };
  });

/**
 * Deletes a batch of blog-content images from R2 (called when a blog post
 * that referenced them is deleted). Best-effort per key — one missing/failed
 * key does not block the others; failures are reported back, not thrown.
 */
export const deleteBlogContentImagesFromR2 = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { paths: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { deleteFromR2 } = await import("@/lib/r2.server");
    const failed: string[] = [];
    for (const path of data.paths) {
      try {
        await deleteFromR2(path);
      } catch {
        failed.push(path);
      }
    }
    return { ok: failed.length === 0, failed };
  });

/**
 * Blog RichTextEditor inline image upload — replaces the old direct
 * Supabase Storage upload. Preserves the exact existing
 * `blog-content/{timestamp}-{filename}` key format. No media_library row
 * is created, matching the pre-existing architecture (inline blog images
 * were never tracked in media_library).
 */
export const uploadBlogContentImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UploadInput) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const bytes = decodeUpload(data.file_base64);

    const { uploadToR2 } = await import("@/lib/r2.server");
    const path = `blog-content/${Date.now()}-${data.file_name}`;
    const { publicUrl } = await uploadToR2(
      path,
      bytes,
      data.file_type || "application/octet-stream",
    );

    // `path` (the bare R2 key, e.g. "blog-content/123-foo.png") is returned alongside
    // publicUrl so the editor can track exactly what it uploaded this session — needed
    // to clean up images that get uploaded then removed again before the post is saved,
    // see RichTextEditor's onImageUploaded and admin.blogs.tsx's sessionUploadedKeys.
    return { publicUrl, path };
  });

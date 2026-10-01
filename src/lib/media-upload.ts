import { uploadMediaLibraryFile } from "@/lib/media-upload.functions";
import { fileToBase64 } from "@/lib/file-to-base64";

/**
 * Uploads a file for the Media Library. Future uploads go to Cloudflare R2
 * (see media-upload.functions.ts + r2.server.ts) instead of Supabase
 * Storage; the public_url returned now points at the R2 custom domain.
 * Existing media_library rows created before this change keep their old
 * Supabase signed URLs untouched — this function only affects new uploads.
 */
export async function uploadToWebsiteMedia(file: File): Promise<string> {
  const file_base64 = await fileToBase64(file);
  const { publicUrl } = await uploadMediaLibraryFile({
    data: {
      file_base64,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    },
  });
  return publicUrl;
}

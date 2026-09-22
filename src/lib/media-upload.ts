import { supabase } from "@/integrations/supabase/client";

export async function uploadToWebsiteMedia(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("website-media")
    .upload(path, file, { upsert: false });
  if (error) throw error;
  const { data: signed } = await supabase.storage
    .from("website-media")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  const url = signed?.signedUrl || "";
  await supabase.from("media_library").insert({
    file_name: file.name,
    storage_path: path,
    public_url: url,
    file_type: file.type,
    file_size: file.size,
    folder: "website",
  });
  return url;
}

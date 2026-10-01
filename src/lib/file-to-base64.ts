// Reads a File and returns its base64 payload (no data: URL prefix), for
// sending to a server function that performs the authorized upload.
// (Mirrors the equivalent local helper in DeveloperApplicationForm.tsx —
// shared here since media-upload.ts and RichTextEditor.tsx both need it.)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

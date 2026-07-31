import { uploadToSupabase } from "./supabaseStorage.js";

/**
 * Downloads an image from a URL and uploads it to Supabase Storage.
 * Returns the public Supabase CDN URL so it is persisted in the database.
 *
 * Falls back to the original URL if the upload fails so the app never breaks.
 */
export async function downloadImage(url: string): Promise<string> {
  try {
    // Determine extension or fallback to .jpg
    let ext = ".jpg";
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const parsedExt = pathname.includes(".")
        ? "." + pathname.split(".").pop()!.toLowerCase()
        : ".jpg";
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(parsedExt)) {
        ext = parsedExt;
      }
    } catch {
      // Ignore URL parsing errors and fallback to .jpg
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine MIME type from content-type header (fallback to jpeg)
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimetype = contentType.split(";")[0].trim();

    const filename = `download${ext}`;
    const publicUrl = await uploadToSupabase(buffer, filename, mimetype);

    console.log(`[download] Downloaded ${url} → Supabase: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("[download] Error downloading/uploading image:", error);
    // Fallback: use the original URL so the app doesn't break
    return url;
  }
}


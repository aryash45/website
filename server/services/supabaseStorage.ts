import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "product-images";

/**
 * Uploads a buffer to the Supabase Storage `product-images` bucket.
 * Returns the public CDN URL of the uploaded file.
 *
 * Requires env vars:
 *   SUPABASE_URL              — e.g. https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service role JWT (NOT the anon key)
 *
 * The bucket must be created and set to PUBLIC in Supabase Dashboard → Storage.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  originalFilename: string,
  mimetype: string = "image/jpeg"
): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "[supabaseStorage] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env. " +
      "Get them from Supabase Dashboard → Project Settings → API."
    );
  }

  // Derive extension from original filename; fallback to .jpg
  const knownExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const rawExt = originalFilename.includes(".")
    ? "." + originalFilename.split(".").pop()!.toLowerCase()
    : ".jpg";
  const ext = knownExts.includes(rawExt) ? rawExt : ".jpg";

  // Unique storage key to prevent collisions
  const storagePath = `${randomUUID()}${ext}`;

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": mimetype,
      // x-upsert: false — never overwrite; each upload gets a unique UUID key
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `[supabaseStorage] Upload failed (HTTP ${response.status}): ${errorText}`
    );
  }

  // Build the public CDN URL — works only when the bucket is set to Public
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  console.log(`[supabaseStorage] Uploaded → ${publicUrl}`);
  return publicUrl;
}

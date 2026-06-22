import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Downloads an image from a URL and saves it to the local /uploads folder.
 * Returns the public relative path (e.g. /uploads/abc-123.jpg)
 */
export async function downloadImage(url: string): Promise<string> {
  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Determine extension or fallback to .jpg
    let ext = ".jpg";
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const parsedExt = path.extname(pathname);
      if (parsedExt && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(parsedExt.toLowerCase())) {
        ext = parsedExt;
      }
    } catch {
      // Ignore URL parsing errors and fallback to .jpg
    }

    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    console.log(`[download] Downloaded ${url} -> ${filePath}`);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("[download] Error downloading image:", error);
    // If download fails, fallback to using the original URL so the app doesn't break
    return url;
  }
}

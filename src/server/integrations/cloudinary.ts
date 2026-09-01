import { v2 as cloudinary } from "cloudinary";
import type { MediaType } from "@/generated/prisma";
import { CLOUDINARY_ROOT, type MediaFolder } from "@/config/media";

/**
 * Cloudinary is the only place uploaded bytes ever live — nothing is written to
 * the application server's disk, which keeps the app stateless and deployable
 * anywhere.
 *
 * Uploads are signed server-side after the admin has been authenticated, so an
 * unsigned preset can never be abused from the browser.
 */

// Re-exported so server code has one import, while the browser can take the
// same constants from `config/media` without pulling in the Node SDK.
export { CLOUDINARY_ROOT, MEDIA_FOLDERS, type MediaFolder } from "@/config/media";

export const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Per-type ceilings, overridable per environment. */
export const UPLOAD_LIMITS = {
  image: Number(process.env.MEDIA_MAX_IMAGE_BYTES ?? 10 * 1024 * 1024),
  video: Number(process.env.MEDIA_MAX_VIDEO_BYTES ?? 200 * 1024 * 1024),
  document: Number(process.env.MEDIA_MAX_DOC_BYTES ?? 20 * 1024 * 1024),
};

const ALLOWED_MIME: Record<string, MediaType> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/avif": "IMAGE",
  "image/gif": "IMAGE",
  "image/svg+xml": "IMAGE",
  "video/mp4": "VIDEO",
  "video/quicktime": "VIDEO",
  "video/webm": "VIDEO",
  "application/pdf": "DOCUMENT",
};

/**
 * Magic-number check. An extension and a declared MIME type are both attacker-
 * controlled, so the first bytes decide what the file actually is.
 */
function sniff(buffer: Buffer): MediaType | null {
  const hex = buffer.subarray(0, 12).toString("hex").toLowerCase();
  const ascii = buffer.subarray(0, 512).toString("utf8");

  if (hex.startsWith("ffd8ff")) return "IMAGE"; // jpeg
  if (hex.startsWith("89504e47")) return "IMAGE"; // png
  if (hex.startsWith("47494638")) return "IMAGE"; // gif
  if (hex.includes("57454250")) return "IMAGE"; // webp (RIFF....WEBP)
  if (hex.includes("66747970")) return "VIDEO"; // mp4/mov ftyp box
  if (hex.startsWith("1a45dfa3")) return "VIDEO"; // webm
  if (hex.startsWith("25504446")) return "DOCUMENT"; // pdf
  // SVG is text; accept only if it really opens as SVG or XML.
  if (/^\s*(<\?xml|<svg)/i.test(ascii)) return "IMAGE";
  return null;
}

export type ValidationResult =
  | { ok: true; type: MediaType }
  | { ok: false; reason: string };

export function validateUpload(file: {
  mimeType: string;
  size: number;
  buffer: Buffer;
}): ValidationResult {
  const declared = ALLOWED_MIME[file.mimeType];
  if (!declared) {
    return { ok: false, reason: `Files of type ${file.mimeType || "unknown"} are not accepted.` };
  }

  const actual = sniff(file.buffer);
  if (!actual) return { ok: false, reason: "That file's contents do not match any accepted type." };
  if (actual !== declared) {
    return { ok: false, reason: "That file's contents do not match its declared type." };
  }

  const limit =
    actual === "VIDEO"
      ? UPLOAD_LIMITS.video
      : actual === "DOCUMENT"
        ? UPLOAD_LIMITS.document
        : UPLOAD_LIMITS.image;

  if (file.size > limit) {
    return {
      ok: false,
      reason: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB; the limit is ${(limit / 1024 / 1024).toFixed(0)}MB.`,
    };
  }

  return { ok: true, type: actual };
}

export type UploadedAsset = {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format?: string;
  width?: number;
  height?: number;
  bytes: number;
  duration?: number;
  folder: string;
};

export async function uploadToCloudinary(
  buffer: Buffer,
  opts: { folder: MediaFolder; filename?: string; type: MediaType },
): Promise<UploadedAsset> {
  if (!cloudinaryConfigured) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* to enable uploads.");
  }

  const folder = `${CLOUDINARY_ROOT}/${opts.folder}`;
  const resourceType = opts.type === "VIDEO" ? "video" : opts.type === "DOCUMENT" ? "raw" : "image";

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // Cloudinary derives a safe public_id; the original name is kept in our
        // own row rather than trusted as a path component.
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      (error, uploaded) => {
        if (error || !uploaded) return reject(error ?? new Error("Upload failed."));
        resolve(uploaded as unknown as Record<string, unknown>);
      },
    );
    stream.end(buffer);
  });

  return {
    publicId: String(result.public_id),
    secureUrl: String(result.secure_url),
    resourceType: String(result.resource_type),
    format: result.format ? String(result.format) : undefined,
    width: typeof result.width === "number" ? result.width : undefined,
    height: typeof result.height === "number" ? result.height : undefined,
    bytes: typeof result.bytes === "number" ? result.bytes : 0,
    duration: typeof result.duration === "number" ? result.duration : undefined,
    folder,
  };
}

export async function deleteFromCloudinary(publicId: string, resourceType = "image") {
  if (!cloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
}

/**
 * Delivery transforms. Visitors should never be served an original-resolution
 * upload, so every public URL goes through one of these presets.
 */
export const TRANSFORMS = {
  thumb: "c_fill,g_auto,w_480,h_270,q_auto,f_auto",
  card: "c_fill,g_auto,w_800,h_450,q_auto,f_auto",
  hero: "c_fill,g_auto,w_1600,h_900,q_auto,f_auto",
  og: "c_fill,g_auto,w_1200,h_630,q_auto,f_auto",
  full: "q_auto,f_auto,w_1600,c_limit",
  video: "q_auto,f_auto",
} as const;

export type TransformName = keyof typeof TRANSFORMS;

/** Inserts a transform into an existing Cloudinary URL, leaving anything else alone. */
export function cdnUrl(secureUrl: string, preset: TransformName = "card") {
  const marker = /\/(image|video|raw)\/upload\//;
  if (!marker.test(secureUrl)) return secureUrl;
  return secureUrl.replace(marker, (m) => `${m}${TRANSFORMS[preset]}/`);
}

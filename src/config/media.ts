/**
 * Media constants shared by the browser and the server.
 *
 * These live outside `server/` deliberately: the admin's media UI needs the
 * folder list, and importing it from the Cloudinary integration would drag the
 * Node SDK — and `fs` — into the client bundle.
 */

export const MEDIA_FOLDERS = ["blogs", "insights", "case-studies", "portfolio", "general"] as const;

export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const CLOUDINARY_ROOT = "nlogn";

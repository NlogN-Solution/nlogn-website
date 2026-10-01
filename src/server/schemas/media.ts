import { z } from "zod";
import { MEDIA_FOLDERS } from "@/server/integrations/cloudinary";

export const mediaFolderSchema = z.enum(MEDIA_FOLDERS).default("general");

export const mediaUpdateSchema = z.object({
  alt: z.string().trim().max(300).optional().or(z.literal("")),
  caption: z.string().trim().max(400).optional().or(z.literal("")),
});

export const mediaQuerySchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "OTHER"]).optional(),
  folder: z.string().trim().max(60).optional(),
});

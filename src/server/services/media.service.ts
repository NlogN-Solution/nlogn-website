import { prisma } from "@/server/db";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  validateUpload,
  type MediaFolder,
} from "@/server/integrations/cloudinary";
import type { MediaType, Prisma } from "@/generated/prisma";

/** The central media library. Every asset row points at a Cloudinary object. */

/**
 * The shape of a media row that an admin form can render.
 *
 * It exists because the obvious short select is a trap. A picker slot
 * (`ImageField`, `FileField`, `MediaThumb`) decides what to draw from
 * `item.type`: an `IMAGE` gets a thumbnail, anything else gets a document icon.
 * Select only `{ id, secureUrl, alt }` and `type` comes back `undefined`, so a
 * cover image that saved perfectly well reappears after a reload as a grey file
 * icon with `undefined` beneath it — which reads, correctly enough, as "the
 * cover image did not save".
 *
 * So every relation an editor loads back into a picker is selected with this,
 * and it matches `MediaItem` in `components/admin/media-picker.tsx` field for
 * field. Public reads are unaffected: they project through their own `toPublic`
 * and only ever want the URL.
 */
export const editorMediaSelect = {
  id: true,
  publicId: true,
  secureUrl: true,
  type: true,
  format: true,
  width: true,
  height: true,
  bytes: true,
  originalName: true,
  folder: true,
  alt: true,
  caption: true,
  createdAt: true,
} as const;

export async function listMedia(filters: {
  q?: string;
  type?: string;
  folder?: string;
  skip: number;
  take: number;
}) {
  const where: Prisma.MediaWhereInput = {};
  if (filters.type && filters.type !== "all") where.type = filters.type as MediaType;
  if (filters.folder && filters.folder !== "all") where.folder = { contains: filters.folder };
  if (filters.q) {
    where.OR = [
      { originalName: { contains: filters.q, mode: "insensitive" } },
      { alt: { contains: filters.q, mode: "insensitive" } },
      { publicId: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
      include: { uploadedBy: { select: { id: true, name: true } } },
    }),
    prisma.media.count({ where }),
  ]);

  return { items, total };
}

export async function saveUpload(opts: {
  buffer: Buffer;
  mimeType: string;
  size: number;
  originalName: string;
  folder: MediaFolder;
  uploadedById: string;
}) {
  const check = validateUpload({
    mimeType: opts.mimeType,
    size: opts.size,
    buffer: opts.buffer,
  });
  if (!check.ok) return { ok: false as const, reason: check.reason };

  const asset = await uploadToCloudinary(opts.buffer, {
    folder: opts.folder,
    type: check.type,
  });

  const media = await prisma.media.create({
    data: {
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      resourceType: asset.resourceType,
      type: check.type,
      format: asset.format,
      width: asset.width,
      height: asset.height,
      bytes: asset.bytes,
      duration: asset.duration,
      originalName: opts.originalName.slice(0, 200),
      folder: asset.folder,
      uploadedById: opts.uploadedById,
    },
  });

  return { ok: true as const, media };
}

/**
 * Counts published content pointing at an asset, so the admin can be warned
 * before deleting something a live page is using.
 */
export async function mediaReferences(id: string) {
  const [blogs, insights, cases, galleries] = await Promise.all([
    prisma.blog.count({ where: { OR: [{ coverMediaId: id }, { ogImageId: id }] } }),
    prisma.insight.count({ where: { OR: [{ coverMediaId: id }, { ogImageId: id }] } }),
    prisma.caseStudy.count({
      where: { OR: [{ heroMediaId: id }, { thumbnailId: id }, { ogImageId: id }] },
    }),
    prisma.caseStudy.count({ where: { gallery: { some: { id } } } }),
  ]);

  return { blogs, insights, caseStudies: cases + galleries, total: blogs + insights + cases + galleries };
}

export async function deleteMedia(id: string) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return null;

  // Cloudinary first: an orphaned row is recoverable, an orphaned asset is a
  // bill nobody can see.
  await deleteFromCloudinary(media.publicId, media.resourceType).catch((error) => {
    console.error("[media] Cloudinary delete failed, removing row anyway:", error);
  });

  await prisma.media.delete({ where: { id } });
  return media;
}

export async function mediaStats() {
  const [byType, aggregate] = await Promise.all([
    prisma.media.groupBy({ by: ["type"], _count: { _all: true }, _sum: { bytes: true } }),
    prisma.media.aggregate({ _count: { _all: true }, _sum: { bytes: true } }),
  ]);

  return {
    total: aggregate._count._all,
    totalBytes: aggregate._sum.bytes ?? 0,
    byType: byType.map((row) => ({
      type: row.type,
      count: row._count._all,
      bytes: row._sum.bytes ?? 0,
    })),
  };
}

import { NextResponse } from "next/server";
import type { Resource } from "@/generated/prisma";
import { prisma } from "@/server/db";

/**
 * Handing over the payload, once something has decided the visitor may have it.
 *
 * Two shapes, and the difference matters. An `externalUrl` is a redirect — the
 * bytes live in Notion or Figma and were never ours to serve. A `fileMedia` is
 * **streamed through this server** rather than redirected to Cloudinary.
 *
 * That proxying is the whole reason the gate is worth anything. Uploads go to
 * Cloudinary as ordinary public objects (see `uploadToCloudinary`), so a
 * redirect would hand every visitor a permanent, unexpiring URL to re-post the
 * moment they had it, and the grant's expiry would protect nothing. Streaming
 * costs a little bandwidth and keeps the delivery URL the only one that exists.
 *
 * It is not a claim that the asset is unguessable — a public-id someone already
 * knows still resolves. It is a promise that nothing here is what tells them.
 */

/** Filename for the Content-Disposition header, with nothing a header parser can trip over. */
function safeFilename(resource: Resource, original: string | null, format: string | null) {
  const base =
    original?.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") ||
    `${resource.slug}${format ? `.${format}` : ""}`;
  return base.slice(0, 120) || "download";
}

export async function deliver(resource: Resource): Promise<NextResponse> {
  if (resource.fileMediaId) {
    const media = await prisma.media.findUnique({
      where: { id: resource.fileMediaId },
      select: { secureUrl: true, originalName: true, format: true, resourceType: true },
    });

    if (!media) {
      console.error(`[resources] ${resource.slug} points at a missing media row`);
      return NextResponse.json(
        { success: false, error: { code: "GONE", message: "That file is no longer available." } },
        { status: 410 },
      );
    }

    const upstream = await fetch(media.secureUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      console.error(`[resources] upstream ${upstream.status} for ${resource.slug}`);
      return NextResponse.json(
        {
          success: false,
          error: { code: "UPSTREAM", message: "We could not fetch that file just now." },
        },
        { status: 502 },
      );
    }

    const filename = safeFilename(resource, media.originalName, media.format);
    const headers = new Headers({
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // The grant is single-visitor and expiring; a shared cache holding the
      // response would outlive both.
      "Cache-Control": "private, no-store",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  }

  const destination = resource.externalUrl ?? resource.repoUrl;
  if (destination) return NextResponse.redirect(destination, 302);

  // Publishing validation should have made this unreachable; if it happens, the
  // visitor has already paid the price of admission and deserves a real answer.
  console.error(`[resources] ${resource.slug} is published with nothing to deliver`);
  return NextResponse.json(
    {
      success: false,
      error: { code: "GONE", message: "That resource has nothing attached to it yet." },
    },
    { status: 410 },
  );
}

import { NextResponse } from "next/server";
import type { Resource } from "@/generated/prisma";
import { prisma } from "@/server/db";
import { resourceDestination } from "@/config/resources";

/**
 * Handing over the payload, once something has decided the visitor may have it.
 *
 * Three shapes, and the differences matter. A `repoUrl` or an `externalUrl` is a
 * redirect — the thing lives on GitHub or in Notion and was never ours to
 * serve, and a repo takes precedence over both of the others for the reason
 * given on `resourceDestination`. A `fileMedia` is **streamed through this server**
 * rather than redirected to Cloudinary.
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
  // `resourceDestination` decides, not the order of the `if`s below: the button
  // the visitor pressed was labelled from the same function, and the two
  // disagreeing is how somebody ends up with a zip after being promised a repo.
  const route = resourceDestination({
    repo: Boolean(resource.repoUrl),
    external: Boolean(resource.externalUrl),
    file: Boolean(resource.fileMediaId),
  });

  if (route === "repo" || route === "external") {
    return NextResponse.redirect((route === "repo" ? resource.repoUrl : resource.externalUrl)!, 302);
  }

  // Narrowed by the id rather than by `route`, which TypeScript cannot use to
  // prove the column is non-null.
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

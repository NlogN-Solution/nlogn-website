import { NextResponse } from "next/server";
import { guard } from "@/server/middleware/guard";
import { ok, paginated, readListParams } from "@/server/http";
import { prisma } from "@/server/db";
import type { Prisma } from "@/generated/prisma";

/**
 * Who unlocked what, and which reel sent them.
 *
 * Behind `messages:read` rather than `content:read`: these rows are contact
 * details a person handed over, and they belong with the enquiry inbox in terms
 * of who should be able to read them, not with the content anyone can edit.
 *
 * `format=csv` returns the list as a file, because the first thing anybody
 * wants to do with a lead list is take it somewhere else.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  // A leading =, +, - or @ is executed as a formula by Excel and Sheets. The
  // apostrophe is the documented way to keep an address an address.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export const GET = guard("messages:read", async (_request, { url }) => {
  const params = readListParams(url, { maxPerPage: 200 });
  const resourceId = url.searchParams.get("resourceId")?.trim();
  const campaign = url.searchParams.get("campaign")?.trim();

  const where: Prisma.ResourceLeadWhereInput = {};
  if (resourceId && resourceId !== "all") where.resourceId = resourceId;
  if (campaign && campaign !== "all") where.campaign = campaign;
  if (params.q) where.email = { contains: params.q, mode: "insensitive" };

  const include = { resource: { select: { title: true, slug: true } } };

  if (url.searchParams.get("format") === "csv") {
    const rows = await prisma.resourceLead.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      // A ceiling rather than the whole table: an unbounded export is how a
      // serverless function runs out of memory on the one day it matters.
      take: 5000,
    });

    const header = ["Email", "Name", "Resource", "Campaign", "Marketing consent", "Date"];
    const body = rows.map((row) =>
      [
        row.email,
        row.name,
        row.resource.title,
        row.campaign,
        row.marketingConsent ? "yes" : "no",
        row.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(","),
    );

    return new NextResponse([header.map(csvCell).join(","), ...body].join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="resource-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const [items, total] = await Promise.all([
    prisma.resourceLead.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.resourceLead.count({ where }),
  ]);

  return ok(paginated(items, total, params.page, params.perPage));
});

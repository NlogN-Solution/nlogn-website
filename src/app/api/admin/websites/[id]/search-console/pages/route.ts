import { ok, paginated } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { searchConsolePages } from "@/server/services/search-console.service";
import { SEARCH_CONSOLE_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force, url }) => {
    const result = await searchConsolePages(website, range, { force });
    if (!result.connected) return ok(result);

    const q = url.searchParams.get("q")?.trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get("perPage") ?? 25) || 25));

    // Filtered and paginated here rather than at Google: the whole result set is
    // already cached, and re-querying per page would spend quota to go slower.
    const rows = q
      ? result.data.rows.filter((row) => row.page.toLowerCase().includes(q))
      : result.data.rows;

    return ok({
      connected: true,
      fetchedAt: result.fetchedAt,
      stale: result.stale,
      range,
      ...paginated(rows.slice((page - 1) * perPage, page * perPage), rows.length, page, perPage),
    });
  },
  { lagDays: SEARCH_CONSOLE_LAG_DAYS },
);

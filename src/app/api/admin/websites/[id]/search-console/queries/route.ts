import { ok, paginated, validationFailed } from "@/server/http";
import { websiteRoute } from "@/server/middleware/seo-guard";
import { searchConsoleQueries } from "@/server/services/search-console.service";
import { POSITION_BANDS, keywordQuerySchema } from "@/server/schemas/seo";
import { SEARCH_CONSOLE_LAG_DAYS } from "@/lib/date-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The keyword table.
 *
 * Search, sort, filter and pagination all run over the cached result set rather
 * than as fresh Search Console queries. Google returns up to a thousand rows in
 * one call, so refetching per page would spend quota to be slower — and the API
 * cannot sort by CTR or filter by position band anyway.
 */
export const GET = websiteRoute(
  "seo:read",
  async (_request, { website, range, force, url }) => {
    const parsed = keywordQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return validationFailed(parsed.error);

    const filters = parsed.data;
    const result = await searchConsoleQueries(website, range, { force });
    if (!result.connected) return ok(result);

    const band = POSITION_BANDS[filters.band];
    const needle = filters.q?.toLowerCase();

    const rows = result.data.rows.filter((row) => {
      if (needle && !row.keyword.toLowerCase().includes(needle)) return false;
      if (row.position < band.min || row.position >= band.max) return false;
      if (filters.minClicks !== undefined && row.clicks < filters.minClicks) return false;
      if (filters.minImpressions !== undefined && row.impressions < filters.minImpressions) return false;
      return true;
    });

    const factor = filters.direction === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      if (filters.sort === "change") {
        // Keywords with no previous data have no change and sort last in either
        // direction — they are not "unchanged", they are unknown.
        if (a.positionChange === null) return 1;
        if (b.positionChange === null) return -1;
        return (a.positionChange - b.positionChange) * factor;
      }
      return (a[filters.sort] - b[filters.sort]) * factor;
    });

    const start = (filters.page - 1) * filters.perPage;

    return ok({
      connected: true,
      fetchedAt: result.fetchedAt,
      stale: result.stale,
      range,
      // Google caps a response at 1,000 rows and anonymises rare queries, so the
      // table is a large sample rather than every search that found the site.
      truncated: result.data.truncated,
      totalKeywords: result.data.rows.length,
      ...paginated(
        rows.slice(start, start + filters.perPage),
        rows.length,
        filters.page,
        filters.perPage,
      ),
    });
  },
  { lagDays: SEARCH_CONSOLE_LAG_DAYS },
);

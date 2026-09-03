import { prisma } from "@/server/db";
import { compare, type Delta } from "@/lib/metrics";
import { ANALYTICS_LAG_DAYS, eachDay, type ComparedRange, type DateRange } from "@/lib/date-range";
import {
  analyticsByChannel,
  analyticsByCountry,
  analyticsByDate,
  analyticsByDevice,
  analyticsLandingPages,
  analyticsTopPages,
  analyticsTotals,
  type BreakdownRow,
  type ChannelRow,
  type PageRow,
} from "@/server/integrations/ga4";
import { googleAccessToken } from "@/server/services/seo-connection.service";
import { TTL, cached } from "@/server/services/seo-cache.service";
import type { Reported } from "@/server/services/search-console.service";
import type { Website } from "@/generated/prisma";

/**
 * GA4 reporting, through the Data API.
 *
 * Separate from the gtag.js snippet the public site already runs — that tag is
 * untouched and keeps collecting exactly as before. This reads the resulting
 * data back out, which needs the numeric property ID and an OAuth credential
 * that the tag neither has nor needs.
 *
 * One honest caveat the dashboard surfaces rather than hides: the site loads
 * Analytics only after cookie consent, so GA4 counts a subset of real visitors.
 * Search Console counts impressions and clicks at Google's end, before consent
 * exists. The two will not agree, and neither is wrong.
 */

const NOT_CONNECTED = {
  connected: false as const,
  reason: "Connect Google Analytics to see traffic, engagement and conversions.",
};

const NO_PROPERTY = {
  connected: false as const,
  reason: "Choose which Google Analytics property this website reports on.",
};

async function context(website: Website) {
  if (!website.ga4PropertyId) return { ok: false as const, reason: NO_PROPERTY };

  const accessToken = await googleAccessToken(website.id);
  if (!accessToken) return { ok: false as const, reason: NOT_CONNECTED };

  return { ok: true as const, accessToken, propertyId: website.ga4PropertyId };
}

function report<T>(payload: { data: T; fetchedAt: Date; stale: boolean; error?: string }) {
  return {
    connected: true as const,
    data: payload.data,
    fetchedAt: payload.fetchedAt.toISOString(),
    stale: payload.stale,
    ...(payload.error && { error: payload.error }),
  };
}

const rangeKey = (range: DateRange) => `${range.start}:${range.end}`;

/** GA4's channel names, matched case-insensitively so a rename does not zero a card. */
function channelUsers(channels: ChannelRow[], name: string): number {
  return channels
    .filter((row) => row.channel.toLowerCase() === name.toLowerCase())
    .reduce((total, row) => total + row.users, 0);
}

export type AnalyticsOverview = {
  users: Delta;
  newUsers: Delta;
  sessions: Delta;
  engagementRate: Delta;
  avgEngagementTime: Delta;
  pageViews: Delta;
  organicUsers: Delta;
  directUsers: Delta;
  referralUsers: Delta;
  /** Null when the property has no key events configured. The card is hidden. */
  conversions: Delta | null;
  channels: ChannelRow[];
  devices: BreakdownRow[];
  /** Empty on a low-traffic property: Google withholds thresholded rows. */
  countries: BreakdownRow[];
  topPages: PageRow[];
  landingPages: PageRow[];
  series: { date: string; users: number; newUsers: number; sessions: number; pageViews: number }[];
  lagDays: number;
};

export async function analyticsOverview(
  website: Website,
  range: ComparedRange,
  { force = false } = {},
): Promise<Reported<AnalyticsOverview>> {
  const ctx = await context(website);
  if (!ctx.ok) return ctx.reason;

  const result = await cached(
    website.id,
    "GOOGLE_ANALYTICS",
    `ga4:overview:${rangeKey(range.current)}:${rangeKey(range.previous)}`,
    TTL.analytics,
    async () => {
      const { accessToken, propertyId } = ctx;

      // Eight reports, but each is cheap and they are independent. Running them
      // in series would make the first load of a cold cache feel broken.
      const [
        current,
        previous,
        daily,
        channels,
        previousChannels,
        devices,
        countries,
        topPages,
        landingPages,
      ] = await Promise.all([
        analyticsTotals(accessToken, propertyId, range.current),
        analyticsTotals(accessToken, propertyId, range.previous),
        analyticsByDate(accessToken, propertyId, range.current),
        analyticsByChannel(accessToken, propertyId, range.current),
        analyticsByChannel(accessToken, propertyId, range.previous),
        analyticsByDevice(accessToken, propertyId, range.current),
        analyticsByCountry(accessToken, propertyId, range.current),
        analyticsTopPages(accessToken, propertyId, range.current),
        analyticsLandingPages(accessToken, propertyId, range.current),
      ]);

      const byDate = new Map(daily.map((point) => [point.date, point]));
      const series = eachDay(range.current).map((date) => ({
        date,
        users: byDate.get(date)?.users ?? 0,
        newUsers: byDate.get(date)?.newUsers ?? 0,
        sessions: byDate.get(date)?.sessions ?? 0,
        pageViews: byDate.get(date)?.screenPageViews ?? 0,
      }));

      return {
        current,
        previous,
        channels,
        previousChannels,
        devices,
        countries,
        topPages,
        landingPages,
        series,
      };
    },
    { force },
  );

  const d = result.data;

  await storeDaily(website.id, d.series, d.channels, d.current).catch(() => undefined);

  return report({
    ...result,
    data: {
      users: compare(d.current.users, d.previous.users),
      newUsers: compare(d.current.newUsers, d.previous.newUsers),
      sessions: compare(d.current.sessions, d.previous.sessions),
      engagementRate: compare(d.current.engagementRate, d.previous.engagementRate),
      avgEngagementTime: compare(d.current.avgEngagementTime, d.previous.avgEngagementTime),
      pageViews: compare(d.current.screenPageViews, d.previous.screenPageViews),
      organicUsers: compare(
        channelUsers(d.channels, "Organic Search"),
        channelUsers(d.previousChannels, "Organic Search"),
      ),
      directUsers: compare(channelUsers(d.channels, "Direct"), channelUsers(d.previousChannels, "Direct")),
      referralUsers: compare(
        channelUsers(d.channels, "Referral"),
        channelUsers(d.previousChannels, "Referral"),
      ),
      conversions:
        d.current.conversions === null
          ? null
          : compare(d.current.conversions, d.previous.conversions ?? 0),
      channels: d.channels,
      devices: d.devices,
      countries: d.countries,
      topPages: d.topPages,
      landingPages: d.landingPages,
      series: d.series,
      lagDays: ANALYTICS_LAG_DAYS,
    },
  });
}

/**
 * Archives daily GA4 totals.
 *
 * GA4's user-scoped data retention can be as short as two months on the default
 * setting, so this is the only reason a twelve-month traffic chart will still
 * work in a year. Channel splits are stored at the range level rather than per
 * day — one extra report per day would triple the quota cost for a breakdown
 * nobody charts daily.
 */
async function storeDaily(
  websiteId: string,
  series: { date: string; users: number; newUsers: number; sessions: number; pageViews: number }[],
  channels: ChannelRow[],
  totals: { engagementRate: number; avgEngagementTime: number; conversions: number | null },
) {
  const totalUsers = series.reduce((sum, point) => sum + point.users, 0);
  if (totalUsers === 0) return;

  const organic = channelUsers(channels, "Organic Search");
  const direct = channelUsers(channels, "Direct");
  const referral = channelUsers(channels, "Referral");

  for (const point of series) {
    if (point.users === 0 && point.sessions === 0) continue;

    // The day's share of the window's channel split. Approximate, and labelled
    // as such wherever it surfaces — the exact daily split would cost a report
    // per day for a number only ever read as a trend.
    const share = point.users / totalUsers;
    const date = new Date(`${point.date}T00:00:00.000Z`);

    const data = {
      users: point.users,
      newUsers: point.newUsers,
      sessions: point.sessions,
      engagedSessions: 0,
      engagementRate: totals.engagementRate,
      avgEngagementTime: totals.avgEngagementTime,
      screenPageViews: point.pageViews,
      organicUsers: Math.round(organic * share),
      directUsers: Math.round(direct * share),
      referralUsers: Math.round(referral * share),
      conversions: totals.conversions,
      syncedAt: new Date(),
    };

    await prisma.analyticsDaily
      .upsert({
        where: { websiteId_date: { websiteId, date } },
        create: { websiteId, date, ...data },
        update: data,
      })
      .catch(() => undefined);
  }
}

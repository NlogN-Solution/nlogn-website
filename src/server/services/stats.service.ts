import { prisma } from "@/server/db";
import { mediaStats } from "@/server/services/media.service";
import { getAllPosts } from "@/lib/blog";
import { works } from "@/config/site";

/**
 * Dashboard figures.
 *
 * Every number here answers an operational question — what is waiting to be
 * published, what has not been replied to, how much storage is in use. Counts
 * that nobody would act on are deliberately absent.
 *
 * Static and CMS content are reported separately rather than summed, because
 * "12 blogs" would hide the fact that six of them cannot be edited here.
 */

export async function dashboardStats() {
  const [
    blogTotal,
    blogPublished,
    blogDraft,
    insightTotal,
    insightPublished,
    insightDraft,
    caseTotal,
    casePublished,
    caseDraft,
    messagesTotal,
    messagesUnread,
    messagesThisWeek,
    subscribers,
    media,
  ] = await Promise.all([
    prisma.blog.count(),
    prisma.blog.count({ where: { status: "PUBLISHED" } }),
    prisma.blog.count({ where: { status: "DRAFT" } }),
    prisma.insight.count(),
    prisma.insight.count({ where: { status: "PUBLISHED" } }),
    prisma.insight.count({ where: { status: "DRAFT" } }),
    prisma.caseStudy.count(),
    prisma.caseStudy.count({ where: { status: "PUBLISHED" } }),
    prisma.caseStudy.count({ where: { status: "DRAFT" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    mediaStats(),
  ]);

  // Read off disk — these are the committed MDX posts and hardcoded case
  // studies the CMS deliberately does not own.
  const staticPosts = getAllPosts();

  return {
    content: {
      blogs: { total: blogTotal, published: blogPublished, drafts: blogDraft },
      insights: { total: insightTotal, published: insightPublished, drafts: insightDraft },
      caseStudies: { total: caseTotal, published: casePublished, drafts: caseDraft },
      staticBlogs: staticPosts.filter((p) => (p.kind ?? "post") === "post").length,
      staticInsights: staticPosts.filter((p) => p.kind === "insight").length,
      staticCaseStudies: works.length,
    },
    media,
    messages: { total: messagesTotal, unread: messagesUnread, thisWeek: messagesThisWeek },
    subscribers,
  };
}

/** The dashboard's activity column: what changed, newest first. */
export async function recentActivity(limit = 8) {
  const [blogs, insights, cases, media, messages, logs] = await Promise.all([
    prisma.blog.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    }),
    prisma.insight.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    }),
    prisma.caseStudy.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, projectName: true, slug: true, status: true, updatedAt: true },
    }),
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, originalName: true, secureUrl: true, type: true, createdAt: true },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, email: true, source: true, isRead: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        summary: true,
        userEmail: true,
        createdAt: true,
      },
    }),
  ]);

  return { blogs, insights, cases, media, messages, logs };
}

export async function listActivity(filters: { q?: string; skip: number; take: number }) {
  const where = filters.q
    ? {
        OR: [
          { action: { contains: filters.q, mode: "insensitive" as const } },
          { resource: { contains: filters.q, mode: "insensitive" as const } },
          { userEmail: { contains: filters.q, mode: "insensitive" as const } },
          { summary: { contains: filters.q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { items, total };
}

import Link from "next/link";
import { ArrowUpRight, BookOpen, Briefcase, HardDrive, Inbox, Lightbulb } from "lucide-react";
import { dashboardStats, recentActivity } from "@/server/services/stats.service";
import { PageHeader } from "@/components/admin/shell";
import { Panel, PanelHeader, StatusBadge } from "@/components/admin/ui";
import { formatBytes } from "@/components/admin/media-picker";

/**
 * Operational overview.
 *
 * Every figure here answers a question somebody would act on — what is waiting
 * to be published, what has not been replied to, how much storage is in use.
 * Static and CMS content are counted separately, because a combined "12 blogs"
 * would hide the fact that six of them cannot be edited from this dashboard.
 */

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  href,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-wash text-violet">
          <Icon className="size-4" />
        </span>
        {href && <ArrowUpRight className="size-4 text-muted" aria-hidden />}
      </div>
      <p className="mt-4 font-display text-2xl font-extrabold tracking-[-0.03em] text-ink">
        {value}
      </p>
      <p className="mt-0.5 text-[0.8125rem] font-medium text-ink-soft">{label}</p>
      {sub && <p className="mt-1 text-[0.75rem] text-muted">{sub}</p>}
    </>
  );

  const className =
    "block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-violet/40";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([dashboardStats(), recentActivity(6)]);

  const totalDrafts =
    stats.content.blogs.drafts + stats.content.insights.drafts + stats.content.caseStudies.drafts;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What is live, what is waiting, and what came in."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Blogs"
          value={stats.content.blogs.published}
          sub={`${stats.content.blogs.drafts} draft${stats.content.blogs.drafts === 1 ? "" : "s"} · ${stats.content.staticBlogs} static`}
          href="/admin/blogs"
        />
        <StatCard
          icon={Lightbulb}
          label="Insights"
          value={stats.content.insights.published}
          sub={`${stats.content.insights.drafts} draft${stats.content.insights.drafts === 1 ? "" : "s"} · ${stats.content.staticInsights} static`}
          href="/admin/insights"
        />
        <StatCard
          icon={Briefcase}
          label="Case studies"
          value={stats.content.caseStudies.published}
          sub={`${stats.content.caseStudies.drafts} draft${stats.content.caseStudies.drafts === 1 ? "" : "s"} · ${stats.content.staticCaseStudies} static`}
          href="/admin/case-studies"
        />
        <StatCard
          icon={Inbox}
          label="Unread messages"
          value={stats.messages.unread}
          sub={`${stats.messages.thisWeek} in the last 7 days`}
          href="/admin/messages"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HardDrive}
          label="Media files"
          value={stats.media.total}
          sub={`${formatBytes(stats.media.totalBytes)} stored`}
          href="/admin/media"
        />
        <div className="rounded-xl border border-line bg-surface p-4 sm:col-span-2 xl:col-span-3">
          <p className="text-[0.8125rem] font-medium text-ink">Where things stand</p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
            {totalDrafts === 0
              ? "Nothing is sitting in drafts."
              : `${totalDrafts} item${totalDrafts === 1 ? " is" : "s are"} still in draft.`}{" "}
            {stats.messages.unread === 0
              ? "Every message has been read."
              : `${stats.messages.unread} message${stats.messages.unread === 1 ? " is" : "s are"} unread.`}{" "}
            {stats.subscribers > 0 && `${stats.subscribers} newsletter subscriber${stats.subscribers === 1 ? "" : "s"}.`}
          </p>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-muted">
            The {stats.content.staticBlogs + stats.content.staticInsights + stats.content.staticCaseStudies}{" "}
            static items counted above are the committed MDX posts and hardcoded case studies. They
            render on the site but are not editable here — they live in the repository.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Recent messages" description="Newest first" />
          {activity.messages.length === 0 ? (
            <p className="px-5 py-8 text-center text-[0.8125rem] text-muted">
              No enquiries yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.messages.map((message) => (
                <li key={message.id}>
                  <Link
                    href={`/admin/messages?open=${message.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink">
                        {message.name}
                      </span>
                      <span className="block truncate text-[0.75rem] text-muted">
                        {message.email} · {message.source.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </span>
                    {!message.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-violet" aria-label="Unread" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Recently edited" description="Across all content types" />
          {[...activity.blogs, ...activity.insights].length === 0 &&
          activity.cases.length === 0 ? (
            <p className="px-5 py-8 text-center text-[0.8125rem] text-muted">
              Nothing created in the CMS yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.blogs.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink">
                    {item.title}
                  </span>
                  <StatusBadge status={item.status} />
                </li>
              ))}
              {activity.insights.slice(0, 2).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink">
                    {item.title}
                  </span>
                  <StatusBadge status={item.status} />
                </li>
              ))}
              {activity.cases.slice(0, 2).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink">
                    {item.projectName}
                  </span>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel>
          <PanelHeader title="Activity log" description="Who did what" />
          {activity.logs.length === 0 ? (
            <p className="px-5 py-8 text-center text-[0.8125rem] text-muted">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-violet">
                    {log.action}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-soft">
                    {log.summary ?? log.resource}
                  </span>
                  <span className="shrink-0 text-[0.75rem] text-muted">
                    {new Date(log.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

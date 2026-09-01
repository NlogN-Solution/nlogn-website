import { listActivity } from "@/server/services/stats.service";
import { PageHeader } from "@/components/admin/shell";
import { Panel, EmptyState } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * The audit trail. Rendered on the server: it is read-only, and a table of
 * facts does not need to become interactive to be useful.
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  const perPage = 50;

  const { items, total } = await listActivity({ skip: (page - 1) * perPage, take: perPage });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <PageHeader
        title="Activity log"
        description={`${total} recorded action${total === 1 ? "" : "s"}`}
      />

      <Panel>
        {items.length === 0 ? (
          <EmptyState title="Nothing logged yet" body="Sign-ins, edits, publishes and deletions are recorded here." />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((log) => (
              <li key={log.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-wide text-violet">
                  {log.action}
                </span>
                <span className="min-w-0 flex-1 text-[0.8125rem] text-ink-soft">
                  {log.summary ?? `${log.resource} ${log.resourceId ?? ""}`}
                </span>
                <span className="shrink-0 text-[0.75rem] text-muted">{log.userEmail ?? "system"}</span>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[0.8125rem]">
            {page > 1 ? (
              <a href={`/admin/activity?page=${page - 1}`} className="text-violet hover:underline">
                ← Newer
              </a>
            ) : (
              <span />
            )}
            <span className="text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <a href={`/admin/activity?page=${page + 1}`} className="text-violet hover:underline">
                Older →
              </a>
            ) : (
              <span />
            )}
          </div>
        )}
      </Panel>
    </>
  );
}

import Link from "next/link";
import { ContentList } from "@/components/admin/content-list";

export const dynamic = "force-dynamic";

export default function ResourcesAdminPage() {
  return (
    <ContentList
      kind="resources"
      title="Resources"
      description="The downloadable library. Published items appear at /resources, and each one can carry its own /r/ short links."
      publicPath="/resources"
      // Nothing in this library is committed to the repository — unlike posts
      // and case studies, every resource is a CMS record.
      staticCount={0}
      headerExtra={
        <Link
          href="/admin/resources/insights"
          className="text-[0.8125rem] font-medium text-violet transition-colors hover:text-ink"
        >
          View the funnel
        </Link>
      }
    />
  );
}

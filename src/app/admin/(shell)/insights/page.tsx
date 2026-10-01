import { ContentList } from "@/components/admin/content-list";
import { getPostsByKind } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default function InsightsPage() {
  return (
    <ContentList
      kind="insights"
      title="Insights"
      description="Long-form strategic pieces. Published items appear at /insights."
      publicPath="/insights"
      staticCount={getPostsByKind("insight").length}
    />
  );
}

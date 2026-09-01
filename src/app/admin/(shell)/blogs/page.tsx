import { ContentList } from "@/components/admin/content-list";
import { getPostsByKind } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default function BlogsPage() {
  return (
    <ContentList
      kind="blogs"
      title="Blogs"
      description="Practical field notes. Published items appear at /blog."
      publicPath="/blog"
      staticCount={getPostsByKind("post").length}
    />
  );
}

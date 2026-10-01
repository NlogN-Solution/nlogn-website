import { ContentList } from "@/components/admin/content-list";
import { works } from "@/config/site";

export const dynamic = "force-dynamic";

export default function CaseStudiesPage() {
  return (
    <ContentList
      kind="case-studies"
      title="Case studies"
      description="Structured project write-ups. Published items appear at /case-studies."
      publicPath="/case-studies"
      staticCount={works.length}
    />
  );
}

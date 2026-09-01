import { ArticleEditor } from "@/components/admin/article-editor";

export const dynamic = "force-dynamic";

export default function NewInsightPage() {
  return <ArticleEditor kind="insights" />;
}

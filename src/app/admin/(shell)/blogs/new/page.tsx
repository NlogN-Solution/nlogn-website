import { ArticleEditor } from "@/components/admin/article-editor";

export const dynamic = "force-dynamic";

export default function NewBlogPage() {
  return <ArticleEditor kind="blogs" />;
}

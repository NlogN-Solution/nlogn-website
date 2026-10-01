import { notFound } from "next/navigation";
import { getArticle } from "@/server/services/article.service";
import { ArticleEditor, type ArticleRecord } from "@/components/admin/article-editor";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getArticle("blog", id);
  if (!record) notFound();

  // Dates cross the server/client boundary as strings.
  return <ArticleEditor kind="blogs" record={JSON.parse(JSON.stringify(record)) as ArticleRecord} />;
}

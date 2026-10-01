import { notFound } from "next/navigation";
import { getArticle } from "@/server/services/article.service";
import { ArticleEditor, type ArticleRecord } from "@/components/admin/article-editor";

export const dynamic = "force-dynamic";

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getArticle("insight", id);
  if (!record) notFound();

  return (
    <ArticleEditor kind="insights" record={JSON.parse(JSON.stringify(record)) as ArticleRecord} />
  );
}

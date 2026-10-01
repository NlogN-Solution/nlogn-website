import { notFound } from "next/navigation";
import { getCaseStudy } from "@/server/services/case-study.service";
import { CaseStudyEditor, type CaseStudyRecord } from "@/components/admin/case-study-editor";

export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getCaseStudy(id);
  if (!record) notFound();

  return <CaseStudyEditor record={JSON.parse(JSON.stringify(record)) as CaseStudyRecord} />;
}

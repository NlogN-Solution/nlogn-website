import { notFound } from "next/navigation";
import { getResource } from "@/server/services/resource.service";
import { ResourceEditor, type ResourceRecord } from "@/components/admin/resource-editor";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getResource(id);
  if (!record) notFound();

  return <ResourceEditor record={JSON.parse(JSON.stringify(record)) as ResourceRecord} />;
}

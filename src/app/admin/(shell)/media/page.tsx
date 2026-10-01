import { MediaLibrary } from "@/components/admin/media-library";
import { mediaStats } from "@/server/services/media.service";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const stats = await mediaStats();
  return <MediaLibrary stats={stats} />;
}

import { getSettings } from "@/server/services/settings.service";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return <SettingsForm initial={await getSettings()} />;
}

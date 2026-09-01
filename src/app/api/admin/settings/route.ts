import { guard } from "@/server/middleware/guard";
import { ok, readBody } from "@/server/http";
import { logActivity } from "@/server/activity";
import { getSettings, updateSettings } from "@/server/services/settings.service";
import { settingsUpdateSchema } from "@/server/schemas/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("settings:read", async () => ok(await getSettings()));

export const PATCH = guard("settings:write", async (request, { user, ip }) => {
  const body = await readBody(request, settingsUpdateSchema);
  if (body.response) return body.response;

  const settings = await updateSettings(body.data);

  await logActivity(user, {
    action: "settings.updated",
    resource: "settings",
    summary: `Updated ${Object.keys(body.data).join(", ")}`,
    ip,
  });

  return ok(settings);
});

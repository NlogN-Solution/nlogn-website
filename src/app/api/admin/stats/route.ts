import { guard } from "@/server/middleware/guard";
import { ok } from "@/server/http";
import { dashboardStats, recentActivity } from "@/server/services/stats.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("content:read", async () => {
  const [stats, activity] = await Promise.all([dashboardStats(), recentActivity()]);
  return ok({ stats, activity });
});

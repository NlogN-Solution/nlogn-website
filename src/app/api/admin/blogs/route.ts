import { articleCollection } from "@/server/routes/article-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST } = articleCollection("blog");

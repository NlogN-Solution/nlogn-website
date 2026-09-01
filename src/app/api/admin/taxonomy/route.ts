import { z } from "zod";
import { guard } from "@/server/middleware/guard";
import { ok, readBody } from "@/server/http";
import { listCategories, listTags, upsertCategory, upsertTag } from "@/server/services/taxonomy.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = guard("content:read", async () => {
  const [categories, tags] = await Promise.all([listCategories(), listTags()]);
  return ok({ categories, tags });
});

const createSchema = z.object({
  kind: z.enum(["category", "tag"]),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional(),
});

export const POST = guard("content:write", async (request) => {
  const body = await readBody(request, createSchema);
  if (body.response) return body.response;

  const record =
    body.data.kind === "category"
      ? await upsertCategory(body.data.name, body.data.description)
      : await upsertTag(body.data.name);

  return ok(record, { status: 201 });
});

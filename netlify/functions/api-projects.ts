import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { projects } from "../../db/schema.js";
import { error, json, requireAuthOrg } from "./_shared/http.js";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;

  if (req.method === "GET" && !id) {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId))
      .orderBy(desc(projects.createdAt));
    return json({ projects: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.orgId, orgId), eq(projects.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ project: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return error("name required");
    const [row] = await db
      .insert(projects)
      .values({
        orgId,
        name,
        code: body.code || null,
        partnerId: body.partnerId || null,
        status: body.status || "draft",
        description: body.description || null,
        budget: body.budget != null ? String(body.budget) : "0",
        startsOn: body.startsOn || null,
        endsOn: body.endsOn || null,
      })
      .returning();
    return json({ project: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "name",
      "code",
      "partnerId",
      "status",
      "description",
      "startsOn",
      "endsOn",
    ] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.budget !== undefined) patch.budget = String(body.budget);
    const [row] = await db
      .update(projects)
      .set(patch)
      .where(and(eq(projects.orgId, orgId), eq(projects.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ project: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/projects", "/api/v1/projects/:id"],
};

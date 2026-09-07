import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { leads } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;
  const url = new URL(req.url);

  if (req.method === "GET" && !id) {
    const stage = url.searchParams.get("stage");
    const rows = stage
      ? await db
          .select()
          .from(leads)
          .where(and(eq(leads.orgId, orgId), eq(leads.stage, stage)))
          .orderBy(desc(leads.createdAt))
      : await db.select().from(leads).where(eq(leads.orgId, orgId)).orderBy(desc(leads.createdAt));
    return json({ leads: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ lead: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    if (!title) return error("title required");
    const [row] = await db
      .insert(leads)
      .values({
        orgId,
        title,
        partnerId: body.partnerId || null,
        stage: body.stage || "new",
        expectedRevenue: body.expectedRevenue != null ? String(body.expectedRevenue) : "0",
        probability: body.probability ?? 10,
        ownerEmail: body.ownerEmail || gate.user!.email || null,
        notes: body.notes || null,
        source: body.source || "manual",
      })
      .returning();
    return json({ lead: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "title",
      "partnerId",
      "stage",
      "probability",
      "ownerEmail",
      "notes",
      "source",
    ] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.expectedRevenue !== undefined) patch.expectedRevenue = String(body.expectedRevenue);
    const [row] = await db
      .update(leads)
      .set(patch)
      .where(and(eq(leads.orgId, orgId), eq(leads.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ lead: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/leads", "/api/v1/leads/:id"],
};

import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { partners } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;

  if (req.method === "GET" && !id) {
    const rows = await db
      .select()
      .from(partners)
      .where(eq(partners.orgId, orgId))
      .orderBy(desc(partners.createdAt));
    return json({ partners: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(partners)
      .where(and(eq(partners.orgId, orgId), eq(partners.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ partner: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return error("name required");
    const [row] = await db
      .insert(partners)
      .values({
        orgId,
        name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        notes: body.notes || null,
      })
      .returning();
    return json({ partner: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["name", "email", "phone", "company", "notes"] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    const [row] = await db
      .update(partners)
      .set(patch)
      .where(and(eq(partners.orgId, orgId), eq(partners.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ partner: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/partners", "/api/v1/partners/:id"],
};

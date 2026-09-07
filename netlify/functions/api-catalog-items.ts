import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { catalogItems } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;
  const url = new URL(req.url);

  if (req.method === "GET" && !id) {
    const kind = url.searchParams.get("kind");
    const conditions = [eq(catalogItems.orgId, orgId)];
    if (kind) conditions.push(eq(catalogItems.kind, kind));
    const rows = await db
      .select()
      .from(catalogItems)
      .where(and(...conditions))
      .orderBy(desc(catalogItems.createdAt));
    return json({ catalogItems: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(catalogItems)
      .where(and(eq(catalogItems.orgId, orgId), eq(catalogItems.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ catalogItem: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return error("name required");
    const kind = body.kind === "product" ? "product" : "service";
    const [row] = await db
      .insert(catalogItems)
      .values({
        orgId,
        name,
        sku: body.sku || null,
        kind,
        unit: body.unit || "db",
        unitPrice: body.unitPrice != null ? String(body.unitPrice) : "0",
        currency: body.currency || "HUF",
        description: body.description || null,
        active: body.active !== false,
      })
      .returning();
    return json({ catalogItem: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["name", "sku", "unit", "currency", "description"] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.kind !== undefined) patch.kind = body.kind === "product" ? "product" : "service";
    if (body.unitPrice !== undefined) patch.unitPrice = String(body.unitPrice);
    if (body.active !== undefined) patch.active = Boolean(body.active);
    const [row] = await db
      .update(catalogItems)
      .set(patch)
      .where(and(eq(catalogItems.orgId, orgId), eq(catalogItems.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ catalogItem: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/catalog-items", "/api/v1/catalog-items/:id"],
};

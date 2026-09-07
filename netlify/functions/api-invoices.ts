import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { invoices } from "../../db/schema.js";
import { error, json, requireAuthOrg } from "./_shared/http.js";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;

  if (req.method === "GET" && !id) {
    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orgId, orgId))
      .orderBy(desc(invoices.createdAt));
    return json({ invoices: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), eq(invoices.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ invoice: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const [row] = await db
      .insert(invoices)
      .values({
        orgId,
        partnerId: body.partnerId || null,
        projectId: body.projectId || null,
        certificateId: body.certificateId || null,
        number: body.number || null,
        status: body.status || "draft",
        issuedOn: body.issuedOn || null,
        dueOn: body.dueOn || null,
        currency: body.currency || "HUF",
        total: body.total != null ? String(body.total) : "0",
        notes: body.notes || null,
      })
      .returning();
    return json({ invoice: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "partnerId",
      "projectId",
      "certificateId",
      "number",
      "status",
      "issuedOn",
      "dueOn",
      "currency",
      "notes",
    ] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.total !== undefined) patch.total = String(body.total);
    const [row] = await db
      .update(invoices)
      .set(patch)
      .where(and(eq(invoices.orgId, orgId), eq(invoices.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ invoice: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/invoices", "/api/v1/invoices/:id"],
};

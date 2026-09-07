import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { feeLines } from "../../db/schema.js";
import { error, json, requireAuthOrg } from "./_shared/http.js";

function lineAmount(quantity: string | number, unitPrice: string | number) {
  return (Number(quantity) * Number(unitPrice)).toFixed(2);
}

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;
  const url = new URL(req.url);

  if (req.method === "GET" && !id) {
    const projectId = url.searchParams.get("projectId");
    const rows = projectId
      ? await db
          .select()
          .from(feeLines)
          .where(and(eq(feeLines.orgId, orgId), eq(feeLines.projectId, projectId)))
          .orderBy(desc(feeLines.createdAt))
      : await db.select().from(feeLines).where(eq(feeLines.orgId, orgId)).orderBy(desc(feeLines.createdAt));
    return json({ feeLines: rows });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const description = String(body.description || "").trim();
    if (!description) return error("description required");
    const quantity = body.quantity != null ? String(body.quantity) : "1";
    const unitPrice = body.unitPrice != null ? String(body.unitPrice) : "0";
    const [row] = await db
      .insert(feeLines)
      .values({
        orgId,
        projectId: body.projectId || null,
        certificateId: body.certificateId || null,
        invoiceId: body.invoiceId || null,
        description,
        quantity,
        unit: body.unit || "db",
        unitPrice,
        amount: body.amount != null ? String(body.amount) : lineAmount(quantity, unitPrice),
      })
      .returning();
    return json({ feeLine: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "description",
      "unit",
      "projectId",
      "certificateId",
      "invoiceId",
    ] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.quantity !== undefined) patch.quantity = String(body.quantity);
    if (body.unitPrice !== undefined) patch.unitPrice = String(body.unitPrice);
    if (body.amount !== undefined) patch.amount = String(body.amount);
    else if (body.quantity !== undefined || body.unitPrice !== undefined) {
      const [existing] = await db
        .select()
        .from(feeLines)
        .where(and(eq(feeLines.orgId, orgId), eq(feeLines.id, id)))
        .limit(1);
      if (!existing) return error("Not found", 404);
      const q = body.quantity != null ? body.quantity : existing.quantity;
      const p = body.unitPrice != null ? body.unitPrice : existing.unitPrice;
      patch.amount = lineAmount(q, p);
    }
    const [row] = await db
      .update(feeLines)
      .set(patch)
      .where(and(eq(feeLines.orgId, orgId), eq(feeLines.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ feeLine: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/fee-lines", "/api/v1/fee-lines/:id"],
};

import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { invoices } from "./_shared/db/schema";
import { error, json, normalizeBrand, requireAuthOrg } from "./_shared/http";

function residualFrom(total: string | number, paid: string | number) {
  const r = Number(total) - Number(paid);
  return (r > 0 ? r : 0).toFixed(2);
}

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;
  const url = new URL(req.url);

  if (req.method === "GET" && !id) {
    const brand = url.searchParams.get("brand");
    const rows = brand
      ? await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.orgId, orgId), eq(invoices.brand, brand.toUpperCase())))
          .orderBy(desc(invoices.createdAt))
      : await db
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
    const total = body.total != null ? String(body.total) : "0";
    const amountPaid = body.amountPaid != null ? String(body.amountPaid) : "0";
    const amountResidual =
      body.amountResidual != null ? String(body.amountResidual) : residualFrom(total, amountPaid);
    const [row] = await db
      .insert(invoices)
      .values({
        orgId,
        partnerId: body.partnerId || null,
        projectId: body.projectId || null,
        certificateId: body.certificateId || null,
        number: body.number || null,
        brand: normalizeBrand(body.brand),
        status: body.status || "draft",
        issuedOn: body.issuedOn || null,
        dueOn: body.dueOn || null,
        currency: body.currency || "HUF",
        total,
        amountPaid,
        amountResidual,
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
    if (body.brand !== undefined) patch.brand = normalizeBrand(body.brand);
    if (body.total !== undefined) patch.total = String(body.total);
    if (body.amountPaid !== undefined) patch.amountPaid = String(body.amountPaid);
    if (body.amountResidual !== undefined) patch.amountResidual = String(body.amountResidual);
    else if (body.total !== undefined || body.amountPaid !== undefined) {
      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.id, id)))
        .limit(1);
      if (!existing) return error("Not found", 404);
      const t = body.total != null ? body.total : existing.total;
      const p = body.amountPaid != null ? body.amountPaid : existing.amountPaid;
      patch.amountResidual = residualFrom(t, p);
    }
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

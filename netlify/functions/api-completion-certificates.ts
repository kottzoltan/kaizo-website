import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { completionCertificates } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

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
          .from(completionCertificates)
          .where(
            and(eq(completionCertificates.orgId, orgId), eq(completionCertificates.projectId, projectId)),
          )
          .orderBy(desc(completionCertificates.createdAt))
      : await db
          .select()
          .from(completionCertificates)
          .where(eq(completionCertificates.orgId, orgId))
          .orderBy(desc(completionCertificates.createdAt));
    return json({ completionCertificates: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(completionCertificates)
      .where(and(eq(completionCertificates.orgId, orgId), eq(completionCertificates.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ completionCertificate: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const projectId = body.projectId;
    if (!title || !projectId) return error("title and projectId required");
    const [row] = await db
      .insert(completionCertificates)
      .values({
        orgId,
        projectId,
        title,
        status: body.status || "draft",
        issuedOn: body.issuedOn || null,
        approvedOn: body.approvedOn || null,
        amount: body.amount != null ? String(body.amount) : "0",
        notes: body.notes || null,
      })
      .returning();
    return json({ completionCertificate: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["title", "status", "issuedOn", "approvedOn", "notes"] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.amount !== undefined) patch.amount = String(body.amount);
    const [row] = await db
      .update(completionCertificates)
      .set(patch)
      .where(and(eq(completionCertificates.orgId, orgId), eq(completionCertificates.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ completionCertificate: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/completion-certificates", "/api/v1/completion-certificates/:id"],
};

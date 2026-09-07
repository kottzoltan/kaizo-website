import type { Config, Context } from "@netlify/functions";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { contacts } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;
  const url = new URL(req.url);

  if (req.method === "GET" && !id) {
    const partnerId = url.searchParams.get("partnerId");
    const projectId = url.searchParams.get("projectId");
    let rows;
    if (partnerId) {
      rows = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.orgId, orgId), eq(contacts.partnerId, partnerId)))
        .orderBy(desc(contacts.createdAt));
    } else if (projectId) {
      rows = await db
        .select()
        .from(contacts)
        .where(and(eq(contacts.orgId, orgId), eq(contacts.projectId, projectId)))
        .orderBy(desc(contacts.createdAt));
    } else {
      rows = await db
        .select()
        .from(contacts)
        .where(eq(contacts.orgId, orgId))
        .orderBy(desc(contacts.createdAt));
    }
    return json({ contacts: rows });
  }

  if (req.method === "GET" && id) {
    const [row] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.orgId, orgId), eq(contacts.id, id)))
      .limit(1);
    if (!row) return error("Not found", 404);
    return json({ contact: row });
  }

  if (req.method === "POST" && !id) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return error("name required");
    if (!body.partnerId && !body.projectId) return error("partnerId or projectId required");
    const [row] = await db
      .insert(contacts)
      .values({
        orgId,
        partnerId: body.partnerId || null,
        projectId: body.projectId || null,
        name,
        email: body.email || null,
        phone: body.phone || null,
        title: body.title || null,
        role: body.role || "contact",
        isPrimary: Boolean(body.isPrimary),
        notes: body.notes || null,
      })
      .returning();
    return json({ contact: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    const body = await req.json().catch(() => ({}));
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "partnerId",
      "projectId",
      "name",
      "email",
      "phone",
      "title",
      "role",
      "notes",
    ] as const) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.isPrimary !== undefined) patch.isPrimary = Boolean(body.isPrimary);
    const [row] = await db
      .update(contacts)
      .set(patch)
      .where(and(eq(contacts.orgId, orgId), eq(contacts.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ contact: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/contacts", "/api/v1/contacts/:id"],
};

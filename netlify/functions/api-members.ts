import type { Config, Context } from "@netlify/functions";
import { and, eq } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { MEMBER_ROLES, memberships } from "./_shared/db/schema";
import { canAdmin, error, json, requireAuthOrg } from "./_shared/http";

export default async (req: Request, context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const id = context.params?.id;

  if (req.method === "GET" && !id) {
    const rows = await db.select().from(memberships).where(eq(memberships.orgId, orgId));
    return json({
      members: rows.map((m) => ({
        id: m.id,
        email: m.email,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
      })),
      roles: MEMBER_ROLES,
    });
  }

  if (req.method === "POST" && !id) {
    if (!canAdmin(gate.membership!.role)) return error("Admin jog kell", 403);
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return error("email required");
    const role = (MEMBER_ROLES as readonly string[]).includes(body.role) ? body.role : "member";
    if (role === "owner") return error("Owner szerep nem adható így", 400);

    const existing = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId), eq(memberships.email, email)))
      .limit(1);
    if (existing[0]) return error("Már tag", 409);

    const [row] = await db
      .insert(memberships)
      .values({
        orgId,
        userId: body.userId || `pending:${email}`,
        email,
        role,
      })
      .returning();
    return json({ member: row }, 201);
  }

  if (req.method === "PATCH" && id) {
    if (!canAdmin(gate.membership!.role)) return error("Admin jog kell", 403);
    const body = await req.json().catch(() => ({}));
    if (!(MEMBER_ROLES as readonly string[]).includes(body.role)) return error("Érvénytelen szerep");
    if (body.role === "owner" && gate.membership!.role !== "owner") {
      return error("Csak owner adhat owner jogot", 403);
    }
    const [row] = await db
      .update(memberships)
      .set({ role: body.role, updatedAt: new Date() })
      .where(and(eq(memberships.orgId, orgId), eq(memberships.id, id)))
      .returning();
    if (!row) return error("Not found", 404);
    return json({ member: row });
  }

  return error("Method not allowed", 405);
};

export const config: Config = {
  path: ["/api/v1/members", "/api/v1/members/:id"],
};

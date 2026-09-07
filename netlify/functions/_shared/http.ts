import { getUser } from "@netlify/identity";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { memberships, organizations } from "../../db/schema.js";

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function requireUser() {
  const user = await getUser();
  if (!user) return { user: null, response: error("Unauthorized", 401) };
  return { user, response: null };
}

export async function requireOrg(req: Request, userId: string) {
  const orgId = req.headers.get("x-org-id")?.trim();

  if (orgId) {
    const rows = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, userId)))
      .limit(1);
    if (!rows[0]) return { org: null, membership: null, response: error("Forbidden org", 403) };
    const orgRows = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    return { org: orgRows[0], membership: rows[0], response: null };
  }

  const rows = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  if (!rows[0]) return { org: null, membership: null, response: error("No organization. Create one via POST /api/v1/orgs", 404) };
  const orgRows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, rows[0].orgId))
    .limit(1);
  return { org: orgRows[0], membership: rows[0], response: null };
}

export async function requireAuthOrg(req: Request) {
  const auth = await requireUser();
  if (auth.response) return { user: null, org: null, membership: null, response: auth.response };
  const tenant = await requireOrg(req, auth.user!.id);
  if (tenant.response) return { user: auth.user, org: null, membership: null, response: tenant.response };
  return { user: auth.user!, org: tenant.org!, membership: tenant.membership!, response: null };
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `org-${Date.now()}`;
}

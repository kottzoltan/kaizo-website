import type { Config, Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index";
import { memberships, organizations } from "../../db/schema";
import { error, json, requireAuthOrg, requireUser, slugify } from "./_shared/http";

export default async (req: Request, _context: Context) => {
  if (req.method === "GET") {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const user = auth.user!;

    const mine = await db.select().from(memberships).where(eq(memberships.userId, user.id));
    const orgs = [];
    for (const m of mine) {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, m.orgId)).limit(1);
      if (org) orgs.push({ ...org, role: m.role });
    }

    return json({
      user: { id: user.id, email: user.email, name: user.name ?? null },
      organizations: orgs,
    });
  }

  if (req.method === "POST" && new URL(req.url).pathname.endsWith("/orgs")) {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    if (!name) return error("name required");

    const trialDays = Number(process.env.KAIZO_TRIAL_DAYS || 60);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const [org] = await db
      .insert(organizations)
      .values({
        name,
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        plan: "trial",
        trialEndsAt,
      })
      .returning();

    await db.insert(memberships).values({
      orgId: org.id,
      userId: auth.user!.id,
      email: auth.user!.email || "",
      role: "owner",
    });

    return json({ organization: org }, 201);
  }

  return error("Not found", 404);
};

export const config: Config = {
  path: ["/api/v1/me", "/api/v1/orgs"],
};

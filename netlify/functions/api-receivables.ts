import type { Config, Context } from "@netlify/functions";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "./_shared/db/index";
import { invoices, partners } from "./_shared/db/schema";
import { error, json, requireAuthOrg } from "./_shared/http";

/** Kinnlevőségek: nyitott / részben fizetett / lejárt kimenő számlák */
export default async (req: Request, _context: Context) => {
  const gate = await requireAuthOrg(req);
  if (gate.response) return gate.response;
  const orgId = gate.org!.id;
  const url = new URL(req.url);
  const brand = url.searchParams.get("brand")?.toUpperCase();

  if (req.method !== "GET") return error("Method not allowed", 405);

  const conditions = [
    eq(invoices.orgId, orgId),
    ne(invoices.status, "draft"),
    ne(invoices.status, "paid"),
    ne(invoices.status, "cancelled"),
  ];
  if (brand) conditions.push(eq(invoices.brand, brand));

  const rows = await db
    .select({
      invoice: invoices,
      partnerName: partners.name,
    })
    .from(invoices)
    .leftJoin(partners, eq(invoices.partnerId, partners.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.dueOn), desc(invoices.createdAt));

  const today = new Date().toISOString().slice(0, 10);
  const items = rows
    .map(({ invoice, partnerName }) => {
      const residual = Number(invoice.amountResidual || 0);
      const total = Number(invoice.total || 0);
      const open =
        residual > 0
          ? residual
          : invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "partial"
            ? total
            : 0;
      if (
        open <= 0 &&
        invoice.status !== "sent" &&
        invoice.status !== "overdue" &&
        invoice.status !== "partial"
      ) {
        return null;
      }
      const due = invoice.dueOn || null;
      const overdue = Boolean(due && due < today && open > 0);
      return {
        ...invoice,
        partnerName: partnerName || null,
        openAmount: open.toFixed(2),
        overdue,
      };
    })
    .filter(Boolean);

  const totalOpen = items.reduce((s, i) => s + Number(i!.openAmount), 0);
  const totalOverdue = items
    .filter((i) => i!.overdue)
    .reduce((s, i) => s + Number(i!.openAmount), 0);

  return json({
    receivables: items,
    summary: {
      count: items.length,
      totalOpen: totalOpen.toFixed(2),
      totalOverdue: totalOverdue.toFixed(2),
      currency: "HUF",
    },
  });
};

export const config: Config = {
  path: "/api/v1/receivables",
};

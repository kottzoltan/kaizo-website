import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

/** Tenant / cég */
export const organizations = pgTable("organizations", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 80 }).notNull().unique(),
  plan: varchar({ length: 32 }).notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  ...timestamps,
});

/** Identity user ↔ org */
export const memberships = pgTable("memberships", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 64 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  role: varchar({ length: 32 }).notNull().default("owner"),
  ...timestamps,
});

/** CRM — ügyfél / partner */
export const partners = pgTable("partners", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 64 }),
  company: varchar({ length: 255 }),
  notes: text(),
  ...timestamps,
});

/** CRM — lead pipeline */
export const leads = pgTable("leads", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  title: varchar({ length: 255 }).notNull(),
  stage: varchar({ length: 32 }).notNull().default("new"),
  expectedRevenue: numeric("expected_revenue", { precision: 14, scale: 2 }).default("0"),
  probability: integer().default(10),
  ownerEmail: varchar("owner_email", { length: 255 }),
  notes: text(),
  source: varchar({ length: 64 }).default("manual"),
  ...timestamps,
});

/** ERP — projekt */
export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  name: varchar({ length: 255 }).notNull(),
  code: varchar({ length: 64 }),
  status: varchar({ length: 32 }).notNull().default("draft"),
  description: text(),
  budget: numeric({ precision: 14, scale: 2 }).default("0"),
  startsOn: date("starts_on"),
  endsOn: date("ends_on"),
  ...timestamps,
});

/** ERP — teljesítésigazolás (TIG) */
export const completionCertificates = pgTable("completion_certificates", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 32 }).notNull().default("draft"),
  issuedOn: date("issued_on"),
  approvedOn: date("approved_on"),
  amount: numeric({ precision: 14, scale: 2 }).default("0"),
  notes: text(),
  ...timestamps,
});

/** ERP — díj / tételsor (projekthez vagy TIG-hez) */
export const feeLines = pgTable("fee_lines", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  certificateId: uuid("certificate_id").references(() => completionCertificates.id, {
    onDelete: "set null",
  }),
  invoiceId: uuid("invoice_id"),
  description: varchar({ length: 500 }).notNull(),
  quantity: numeric({ precision: 12, scale: 3 }).notNull().default("1"),
  unit: varchar({ length: 32 }).default("db"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  amount: numeric({ precision: 14, scale: 2 }).notNull().default("0"),
  ...timestamps,
});

/** ERP — számla */
export const invoices = pgTable("invoices", {
  id: uuid().primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  certificateId: uuid("certificate_id").references(() => completionCertificates.id, {
    onDelete: "set null",
  }),
  number: varchar({ length: 64 }),
  status: varchar({ length: 32 }).notNull().default("draft"),
  issuedOn: date("issued_on"),
  dueOn: date("due_on"),
  currency: varchar({ length: 8 }).notNull().default("HUF"),
  total: numeric({ precision: 14, scale: 2 }).notNull().default("0"),
  notes: text(),
  ...timestamps,
});

export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type CompletionCertificate = typeof completionCertificates.$inferSelect;
export type FeeLine = typeof feeLines.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;

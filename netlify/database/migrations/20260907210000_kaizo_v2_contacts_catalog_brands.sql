-- Kaizo v2: contacts, catalog (products/services), brand (ICE/STAR/COOP), receivables fields

ALTER TABLE "partners"
  ADD COLUMN IF NOT EXISTS "brand" varchar(16) DEFAULT 'ICE',
  ADD COLUMN IF NOT EXISTS "tax_id" varchar(64),
  ADD COLUMN IF NOT EXISTS "city" varchar(128),
  ADD COLUMN IF NOT EXISTS "status" varchar(32) DEFAULT 'active';

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "brand" varchar(16) DEFAULT 'ICE';

ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "brand" varchar(16) DEFAULT 'ICE',
  ADD COLUMN IF NOT EXISTS "amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
  ADD COLUMN IF NOT EXISTS "amount_residual" numeric(14, 2) DEFAULT '0' NOT NULL;

CREATE TABLE IF NOT EXISTS "contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "partner_id" uuid REFERENCES "partners"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(64),
  "title" varchar(128),
  "role" varchar(64) DEFAULT 'contact',
  "is_primary" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "catalog_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "name" varchar(255) NOT NULL,
  "sku" varchar(64),
  "kind" varchar(32) DEFAULT 'service' NOT NULL,
  "brand" varchar(16) DEFAULT 'ICE',
  "unit" varchar(32) DEFAULT 'db',
  "unit_price" numeric(14, 2) DEFAULT '0' NOT NULL,
  "currency" varchar(8) DEFAULT 'HUF' NOT NULL,
  "description" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "fee_lines"
  ADD COLUMN IF NOT EXISTS "catalog_item_id" uuid REFERENCES "catalog_items"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS contacts_org_id_idx ON "contacts" ("org_id");
CREATE INDEX IF NOT EXISTS contacts_partner_id_idx ON "contacts" ("partner_id");
CREATE INDEX IF NOT EXISTS catalog_items_org_id_idx ON "catalog_items" ("org_id");
CREATE INDEX IF NOT EXISTS partners_brand_idx ON "partners" ("brand");
CREATE INDEX IF NOT EXISTS projects_brand_idx ON "projects" ("brand");
CREATE INDEX IF NOT EXISTS invoices_status_idx ON "invoices" ("status");

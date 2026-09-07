-- Kaizo v1 core: orgs, CRM, ERP (projects, TIG, fees, invoices)
CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(80) NOT NULL UNIQUE,
  "plan" varchar(32) DEFAULT 'trial' NOT NULL,
  "trial_ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "user_id" varchar(64) NOT NULL,
  "email" varchar(255) NOT NULL,
  "role" varchar(32) DEFAULT 'owner' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "name" varchar(255) NOT NULL,
  "email" varchar(255),
  "phone" varchar(64),
  "company" varchar(255),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "partner_id" uuid REFERENCES "partners"("id") ON DELETE set null,
  "title" varchar(255) NOT NULL,
  "stage" varchar(32) DEFAULT 'new' NOT NULL,
  "expected_revenue" numeric(14, 2) DEFAULT '0',
  "probability" integer DEFAULT 10,
  "owner_email" varchar(255),
  "notes" text,
  "source" varchar(64) DEFAULT 'manual',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "partner_id" uuid REFERENCES "partners"("id") ON DELETE set null,
  "name" varchar(255) NOT NULL,
  "code" varchar(64),
  "status" varchar(32) DEFAULT 'draft' NOT NULL,
  "description" text,
  "budget" numeric(14, 2) DEFAULT '0',
  "starts_on" date,
  "ends_on" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "completion_certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "title" varchar(255) NOT NULL,
  "status" varchar(32) DEFAULT 'draft' NOT NULL,
  "issued_on" date,
  "approved_on" date,
  "amount" numeric(14, 2) DEFAULT '0',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "partner_id" uuid REFERENCES "partners"("id") ON DELETE set null,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "certificate_id" uuid REFERENCES "completion_certificates"("id") ON DELETE set null,
  "number" varchar(64),
  "status" varchar(32) DEFAULT 'draft' NOT NULL,
  "issued_on" date,
  "due_on" date,
  "currency" varchar(8) DEFAULT 'HUF' NOT NULL,
  "total" numeric(14, 2) DEFAULT '0' NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "fee_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE cascade,
  "certificate_id" uuid REFERENCES "completion_certificates"("id") ON DELETE set null,
  "invoice_id" uuid,
  "description" varchar(500) NOT NULL,
  "quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
  "unit" varchar(32) DEFAULT 'db',
  "unit_price" numeric(14, 2) DEFAULT '0' NOT NULL,
  "amount" numeric(14, 2) DEFAULT '0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON "memberships" ("user_id");
CREATE INDEX IF NOT EXISTS partners_org_id_idx ON "partners" ("org_id");
CREATE INDEX IF NOT EXISTS leads_org_id_idx ON "leads" ("org_id");
CREATE INDEX IF NOT EXISTS projects_org_id_idx ON "projects" ("org_id");
CREATE INDEX IF NOT EXISTS completion_certificates_org_id_idx ON "completion_certificates" ("org_id");
CREATE INDEX IF NOT EXISTS fee_lines_org_id_idx ON "fee_lines" ("org_id");
CREATE INDEX IF NOT EXISTS invoices_org_id_idx ON "invoices" ("org_id");

# App home CRM/ERP expansion + confirm auto-login

## Goal

Email confirm link logs the user in immediately. Live `/app` is a KKV dashboard (CRM/ERP demo look): sidebar, KPIs, partners, contacts, receivables, catalog, projects, TIG, invoices, users/roles.

## Not in scope

ICE / STAR / COOP brand filters — those are separate products. Kaizo is general SME (KKV).

## Auth fix

Login uses `handleAuthCallback()` so `nf_jwt` cookies are set and the user enters `/app` immediately after confirm.

## Data / API

- Migration `20260907210000_kaizo_v2_contacts_catalog_brands.sql` (brand columns legacy/unused)
- Tables: `contacts`, `catalog_items`; invoice residuals for receivables
- Endpoints: `/api/v1/members`, `/contacts`, `/catalog-items`, `/receivables`

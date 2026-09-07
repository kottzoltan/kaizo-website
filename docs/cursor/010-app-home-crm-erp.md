# App home CRM/ERP expansion + confirm auto-login

## Goal

Email confirm link logs the user in immediately. Live `/app` home supports users/roles, partners, contacts, receivables, ICE/STAR/COOP brand filter, catalog (products/services), projects, TIG, invoices — without members/employees/payroll.

## Auth fix

`confirmEmail()` alone does not set `nf_jwt` cookies. Login page now uses only `handleAuthCallback()`, which confirms and sets cookies, then redirects into `/app/`.

## Data / API

- Migration `20260907210000_kaizo_v2_contacts_catalog_brands.sql`
- Brand `ICE|STAR|COOP` on partners, projects, catalog, invoices
- Tables: `contacts`, `catalog_items`
- Invoice residuals for receivables
- Endpoints: `/api/v1/members`, `/contacts`, `/catalog-items`, `/receivables`

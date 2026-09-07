# Bootstrap API v1

## Stack

- Netlify Functions (modern `path` routing)
- Netlify Database + Drizzle (`db/schema.ts`)
- Netlify Identity (`@netlify/identity`)

## Endpoints (v1)

| Method | Path | Leírás |
|--------|------|--------|
| GET | `/api/v1/me` | Bejelentkezett user + org memberships |
| POST | `/api/v1/orgs` | Új szervezet (trial) |
| GET/POST | `/api/v1/partners` | Ügyfelek / partnerek |
| GET/POST/PATCH | `/api/v1/leads` | CRM lead pipeline |
| GET/POST/PATCH | `/api/v1/projects` | ERP projektek |
| GET/POST/PATCH | `/api/v1/completion-certificates` | Teljesítésigazolások |
| GET/POST | `/api/v1/fee-lines` | Díjak / tételsorok |
| GET/POST/PATCH | `/api/v1/invoices` | Számlák |

Minden endpoint Identity JWT-t vár. Tenant: `X-Org-Id`.

## Local

```bash
npm install
npm run db:generate
# Deploy preview szükséges Identity teszthez (netlify dev Identity-t nem támogat)
```

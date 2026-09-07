# KAIZO Design Decisions

## Architecture

| Döntés | Választás | Indok |
|--------|-----------|--------|
| Backend | **Új Kaizo backend** a `kaizo-website` Netlify site-on | CRM/ERP saját termék; Aivio marad AI/voice réteg |
| Adat | **Netlify Database** (Postgres) + Drizzle | GA, preview branching, Netlify-native |
| Auth | **Netlify Identity** (`@netlify/identity`) | Login kötelező a kipróbáláshoz; JWT a functionökön |
| Multi-tenant | `organizations` + `memberships` | Egy user több céghez; trial org-onként |
| Telefon / voice | **Hátra** | Először CRM + ERP (projekt / TIG / számla) |

## Termék / árazás (nyitott)

Login **kötelező** a demóhoz. Árazási modell még döntés alatt:

- **A)** 1–3 hónap ingyen trial → alacsony havidíj
- **B)** Minimális funkció ingyen (freemium) → többi fizetős

Implementáció: `organizations.plan` + `trial_ends_at` mezők — mindkét modellre alkalmas.

## Modul scope (v1)

### CRM (első prioritás)
- Partnerek / ügyfelek
- Lead pipeline (stage váltás)
- Aktivitások / teendők
- Megjegyzések

### ERP (v1 tartalom — nem csak számla)
- **Projektek** (ügyfélhez kötve, státusz, érték)
- **Teljesítésigazolások (TIG)**
- **Díjak / tételsorok** (óra, átalány, egységár)
- **Számlák** (projektből / TIG-ből származtatható)

### Később
- Rendelések, raktár, AI voice, Aivio bridge

## API

- Prefix: `/api/v1/*`
- Auth: Identity JWT (function: `getUser()`)
- Tenant: `X-Org-Id` header vagy default membership

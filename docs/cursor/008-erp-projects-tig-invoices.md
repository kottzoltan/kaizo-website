# ERP Module — Projektek, TIG, díjak, számlák

## Scope v1

Nem „csak számla + rendelés”. A Kaizo ERP v1:

| Entitás | Magyar | Leírás |
|---------|--------|--------|
| Project | Projekt | Ügyfélhez kötött munka, státusz, érték |
| CompletionCertificate | Teljesítésigazolás (TIG) | Projekthez / mérföldkőhöz |
| FeeLine | Díj / tétel | Óradíj, átalány, mennyiség × egységár |
| Invoice | Számla | TIG-ből vagy projekt tételekből |

## Státuszok (kezdő)

**Projekt:** `draft` → `active` → `on_hold` → `done` → `cancelled`  
**TIG:** `draft` → `sent` → `approved` → `rejected`  
**Számla:** `draft` → `issued` → `paid` → `cancelled`

## API

- `/api/v1/projects`
- `/api/v1/completion-certificates`
- `/api/v1/fee-lines`
- `/api/v1/invoices`

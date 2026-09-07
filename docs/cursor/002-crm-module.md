# CRM Module

## Cél

Bejelentkezés után kipróbálható, adatot mentő CRM — nem csak demó HTML.

## Entitások

- **Partner** — ügyfél / cég / kapcsolat
- **Lead** — pipeline stage-ekkel (new → qualified → proposal → won/lost)
- **Activity** — hívás, meeting, teendő (későbbi kör)

## API

- `GET/POST /api/v1/partners`
- `GET/POST/PATCH /api/v1/leads` (+ `?stage=`)

## Felületek

| URL | Szerep |
|-----|--------|
| `/` `kaizo-crm.html` `kaizo-erp.html` | **Publikus demó** — változatlan, login nélkül |
| `/app/login.html` | Éles regisztráció / belépés |
| `/app/` | Éles CRM/ERP (trial org, élő API) |

A marketing / demó UI-t ne kösd az Identity-hez.

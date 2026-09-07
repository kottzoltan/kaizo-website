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

## UI

`kaizo-crm.html` → login gate → API hívások (localStorage mock helyett).

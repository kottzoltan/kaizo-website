# KAIZO Modules

## Aktív (élő `/app`)

| Modul | Állapot | Megjegyzés |
|-------|---------|------------|
| Auth | Login + email confirm → auto-login | Netlify Identity |
| Jogosultság | Felhasználók / szerepkörök | owner · admin · member · viewer |
| CRM | Dashboard + menü | Partnerek, kapcsolattartók, leadek |
| ERP | Dashboard + menü | Projektek, katalógus, TIG, számlák, kinnlevőség |
| Marketing site | Élő | kaizo.hu (demók érintetlenek) |
| AI voice (Aivio) | Hátrébb | `/agent-api` proxy megmarad |

## Nem része a Kaizo KKV terméknek

- **ICE / STAR / COOP** — külön termékek (iskolaszövetkezet / munkaerőkölcsönzés / szociális szövetkezet). A Kaizo általános KKV CRM/ERP; nincs brand-szűrő.
- Tagok (association), munkavállalók, számfejtési bérek / HR

## ERP folyamat

Katalógus → Projekt → TIG → Díjsor → Számla → Kinnlevőség

## Később

Naptár, ajánlat/szerződés, telefon, Stripe billing, white-label

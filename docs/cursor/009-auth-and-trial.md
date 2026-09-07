# Auth + trial — email confirmation (Autoconfirm OFF)

## Kötelező Netlify beállítás

**Project configuration → Identity** (Autoconfirm maradjon **OFF**):

1. **Site URL** = `https://kaizo.hu`  
   (a custom confirm template a `/app/login.html#confirmation_token=` útvonalat használja)
2. **Emails → Confirmation template** path (Pro): `/identity-email-templates/confirmation.html`  
   Ha nincs Pro: állítsd a Site URL-t erre: `https://kaizo.hu/app/login.html`

## Hogyan működik

1. Regisztráció → megerősítő email  
2. Link → `/app/login.html#confirmation_token=…`  
3. `confirmEmail(token)` / `handleAuthCallback()` → session  
4. Átirányítás `/app/`

Újraküldés: login oldal gomb, vagy Identity → Users → Send confirmation.

## Próba

1. https://kaizo.hu/app/login.html  
2. Regisztráció  
3. Email link ugyanabban a böngészőben  
4. Demó CRM/ERP továbbra is login nélkül

## Árazás (később)

`organizations.plan` + `trial_ends_at` (default 60 nap, `KAIZO_TRIAL_DAYS`)

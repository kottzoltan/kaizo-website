# Kaizo Backend — Netlify Identity + Database

## Deploy után (egyszer)

1. **Identity** bekapcsolása: Netlify → Project configuration → Identity  
   - Registration: Open (vagy Invite only)  
   - Autoconfirm: fejlesztéshez ON
2. A deploy automatikusan provisionálja a **Netlify Database**-t (`@netlify/database`)
3. Migration: `netlify/database/migrations/20260907180000_kaizo_v1_core.sql` a deploy során lefut

## Próba (éles app — nem a demó)

1. https://&lt;site&gt;/app/login.html  
2. Regisztráció / belépés  
3. `/app/` — trial org + élő lead/projekt  
4. A publikus `/kaizo-crm.html` / `/kaizo-erp.html` **marad demó**, login nélkül

## Árazás (később)

`organizations.plan` + `trial_ends_at` (default 60 nap, `KAIZO_TRIAL_DAYS`)

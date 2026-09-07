# Kaizo Backend — Netlify Identity + Database

## Deploy után (egyszer)

1. **Identity** bekapcsolása: Netlify → Project configuration → Identity  
   - Registration: Open (vagy Invite only)  
   - Autoconfirm: fejlesztéshez ON
2. A deploy automatikusan provisionálja a **Netlify Database**-t (`@netlify/database`)
3. Migration: `netlify/database/migrations/20260907180000_kaizo_v1_core.sql` a deploy során lefut

## Próba

1. https://&lt;site&gt;/login.html  
2. Regisztráció / belépés  
3. CRM vagy ERP megnyitása — trial org + példa lead/projekt létrejön  
4. API: `GET /api/v1/me` (bejelentkezve)

## Árazás (később)

`organizations.plan` + `trial_ends_at` (default 60 nap, `KAIZO_TRIAL_DAYS`)

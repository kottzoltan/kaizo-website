# Kaizo Backend — Netlify Identity + Database

## Deploy után (egyszer)

1. **Identity** bekapcsolása: Netlify → Project configuration → Identity  
   - Registration: Open (vagy Invite only)  
   - Autoconfirm: fejlesztéshez ON
2. A deploy automatikusan provisionálja a **Netlify Database**-t (`@netlify/database`)
3. Migration: `netlify/database/migrations/20260907180000_kaizo_v1_core.sql` a deploy során lefut

## Identity beállítás (kötelező a email confirmhoz)

Netlify → Project configuration → **Identity**:

1. **Site URL** = `https://kaizo.hu/app/login.html`  
   (a megerősítő email ide hoz vissza a hash tokennel)
2. Fejlesztés / trial: **Autoconfirm** = ON (nincs email confirm)
3. Registration = Open

A `/app/login.html` hívja a `handleAuthCallback()`-et — nélküle a confirm link nem zárja le a fiókot, és `invalid_grant: Email not confirmed` jön.

`organizations.plan` + `trial_ends_at` (default 60 nap, `KAIZO_TRIAL_DAYS`)

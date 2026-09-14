# Nexvision Website

5-page static agency website with a Supabase-powered client order system and private admin dashboard.

## One-time Supabase setup

1. Open `supabase-config.js`.
2. Set `SUPABASE_URL` to the project URL shown in Supabase.
3. Set `SUPABASE_ANON_KEY` to the project's **public anon key**. Never use the service_role/secret key.
4. Make sure the `orders` table and its RLS policies are installed.
5. The allowed admin UID is set in `admin.js` to the Supabase user created during setup.

## Pages

- `index.html` — Home
- `services.html` — Services
- `portfolio.html` — Portfolio
- `about.html` — About
- `contact.html` — Client order form
- `admin.html` — Admin login + orders dashboard

## GitHub Pages

Upload all files in this folder to the root of your repository and publish from `main` / root.

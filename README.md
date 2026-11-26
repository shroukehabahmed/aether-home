# Aether Home — Smart Home Dashboard

A smart-home web app with a dark, editorial UI. Thirteen screens covering the full flow: sign-up, login, password reset, then the app itself (dashboard, devices, scenes, automations, activity logs, energy, security, notifications, add-device pairing, settings). Full English/Arabic switch with RTL layout.

Built with HTML, Tailwind CSS (CDN) and a vanilla JS layer (`app.js`). Fonts: Manrope, Inter, Material Symbols.

## What is real vs simulated

**Real (backed by Supabase, free tier, $0):**
- Accounts: sign-up, login and password reset are real, powered by Supabase Auth (email + password).
- Database: every change a signed-in user makes (profile, devices, scenes, automations, settings, language) is saved to a real Postgres table (`user_state`) and follows the account across browsers and devices.
- Security: row-level security means each account can only read and write its own data.

**Simulated (demo data, no physical devices):**
- The app does not talk to real lights, locks or cameras. Device states, sensor readings, energy numbers and activity logs are realistic demo data stored per account.

## How the backend works

- Frontend calls Supabase directly from the browser (`@supabase/supabase-js` via CDN) — no server to host, so the whole app stays a static site on GitHub Pages.
- Config lives at the top of `app.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). The anon/publishable key is safe to expose; access is controlled by row-level security policies.
- Without config, the app still works fully as a local demo, persisting to the browser's localStorage.
- Database schema (run once in the Supabase SQL editor):

```sql
create table if not exists public.user_state (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.user_state enable row level security;
create policy "users manage their own state" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.user_state to authenticated;
```

## Cost

Supabase free tier: $0/month, no card. Covers the demo scale comfortably (500 MB database, 50k monthly active users). GitHub Pages hosting: $0.

## Screens

| Page | File |
| --- | --- |
| Dashboard | `index.html` |
| Devices | `devices.html` |
| Scenes | `scenes.html` |
| Automations | `automations.html` |
| Activity logs | `activity.html` |
| Energy | `energy.html` |
| Security | `security.html` |
| Notifications | `notifications.html` |
| Add device | `add-device.html` |
| Settings | `settings.html` |
| Login | `login.html` |
| Sign up | `signup.html` |
| Reset password | `reset-password.html` |

## View it

Open `index.html` in any browser, or see the live demo on GitHub Pages: https://shroukehabahmed.github.io/aether-home/

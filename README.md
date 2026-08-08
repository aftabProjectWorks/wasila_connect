# Wasila Connect

This branch contains the initial application scaffold for Wasila using Next.js (App Router), TypeScript, Tailwind CSS and Supabase (Postgres + Auth).

This repository is intended as a single modular-monolith application. The Supabase/Postgres database is the source of truth and SQL migrations are used for schema and RLS policies.

Quick start (development)

1. Install dependencies

   npm install

2. Create a Supabase project (local or cloud) and obtain the project URL and anon/service keys.
   - For local development you can use the Supabase CLI: https://supabase.com/docs/guides/cli

3. Copy .env.example to .env.local and fill in values.

4. Apply database migrations (see db/migrations/*.sql). You can use psql or the Supabase SQL editor.

5. Run the dev server

   npm run dev

Important notes

- Do NOT commit secrets. Use environment variables.
- Razorpay integration is disabled by default and requires credentials to enable.
- Supabase Row Level Security (RLS) is intended; migration SQL includes placeholders and recommended policies. Review and adjust before enabling in production.

Branch: app/init-nextjs

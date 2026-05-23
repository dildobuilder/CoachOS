# Sprint 1A Local QA

This checklist verifies only Sprint 1A: auth, protected workspace, trainer profile bootstrap, and client CRUD. Calendar, sessions, and workouts are intentionally out of scope.

## 1. Run Locally

Install dependencies:

```bash
pnpm install
```

Run static checks:

```bash
pnpm typecheck
pnpm lint
```

Start the app:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## 2. Required Env Variables

The app requires these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without them, Supabase client creation fails during page rendering or middleware execution.

If these variables are missing, protected routes and the home page redirect to `/login?setup=supabase`.
Login and registration submissions also return to the auth screens with the same setup hint instead of opening the Next.js error overlay.

## 3. Create `.env.local`

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill `.env.local` with values from the Supabase project API settings.

## 4. Connect Supabase Project

In Supabase dashboard:

1. Open the target project.
2. Go to Project Settings -> API.
3. Copy Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart `pnpm dev` after changing env variables.

## 5. Apply SQL Migrations

Apply these migrations to the Supabase project, in order:

```text
supabase/migrations/202605230001_create_trainer_profiles.sql
supabase/migrations/202605230002_create_clients.sql
```

Use either the Supabase SQL editor or Supabase CLI.

Expected database objects:

- `public.trainer_profiles`
- `public.clients`
- RLS enabled on both tables
- select/insert/update policies for own trainer data
- no delete policy for `clients`

If login redirects to `/login?setup=migrations` or the app reports that `public.trainer_profiles` is missing, the migrations have not been applied to the connected Supabase project.

## 6. Check Registration

1. Open `/register`.
2. Enter a valid email and a password of at least 6 characters.
3. Submit the form.
4. Confirm the app redirects to `/dashboard`.
5. In Supabase, verify a matching `trainer_profiles` row exists with `id = auth.users.id`.

If email confirmation is enabled in Supabase Auth, confirm the email before expecting a usable session.

## 7. Check Login

1. Open `/login`.
2. Enter the registered email and password.
3. Submit the form.
4. Confirm the app redirects to `/dashboard`.
5. Confirm the top navigation and logout button are visible.

## 8. Check Protected Routes

While logged out, open:

```text
/dashboard
/clients
/clients/new
```

Expected result:

- unauthenticated users are redirected to `/login`;
- authenticated users can open protected routes.

## 9. Check Client Creation

1. Log in.
2. Open `/clients`.
3. Click `Новый клиент`.
4. Fill at least `Имя`.
5. Optionally fill goal, level, phone, notes, limitations, training frequency, and split.
6. Submit.

Expected result:

- client is created;
- app redirects to `/clients/[clientId]`;
- client profile shows the saved data;
- `clients.trainer_id` equals the logged-in trainer id.

## 10. Check Client Editing

1. Open an existing client profile.
2. Click `Редактировать`.
3. Change one or more fields.
4. Submit.

Expected result:

- app redirects back to the client profile;
- updated values are visible;
- `updated_at` changes in the database.

## 11. Check Client Archiving

1. Open an existing client profile.
2. Click `Редактировать`.
3. Use `Архивировать`.

Expected result:

- client status becomes `archived`;
- app redirects to `/clients`;
- the archived client is not shown in the default clients list.

## 12. Check Archived Client Disappears From Active List

After archiving:

1. Open `/clients`.
2. Confirm the archived client is absent.
3. Directly open `/clients/[clientId]` for the archived client.

Expected result:

- active list hides archived clients;
- direct profile access still works for the owning trainer.

## 13. Known Limitations

- Calendar is a placeholder until Sprint 1B.
- Workout sessions are placeholders until Sprint 1B.
- Client history is a placeholder until Sprint 1B.
- No exercise library.
- No program templates.
- No nutrition, weight logs, or check-ins.
- No password reset flow yet.
- No production deployment config yet.
- Supabase database types are currently maintained manually for Sprint 1A.
- `@supabase/ssr@0.5.2` needs a typed wrapper bridge with current `@supabase/supabase-js`.

## 14. Sprint 1A Completion Criteria

Sprint 1A is complete when:

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm dev` starts successfully.
- `.env.local` is configured.
- SQL migrations are applied.
- trainer can register.
- trainer can log in and log out.
- protected routes redirect logged-out users.
- trainer profile is created automatically.
- trainer can create a client.
- trainer can edit a client.
- trainer can archive a client.
- archived clients disappear from the default active clients list.
- RLS prevents access to another trainer's profile and clients.

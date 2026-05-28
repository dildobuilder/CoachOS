# Private Preview Deployment

Sprint 1E-0 prepares CoachOS for a closed Vercel deployment. This is not a public SaaS launch: public signup is disabled and protected routes are available only to allowed emails.

## Vercel Setup

1. Open Vercel and import the GitHub repository `dildobuilder/CoachOS`.
2. Keep the default Next.js framework preset.
3. Use the default install/build commands unless Vercel detects different values:
   - Install: `pnpm install`
   - Build: `pnpm build`
4. Add the environment variables below for Production and Preview.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
REGISTRATION_ENABLED=false
ALLOWED_EMAILS=mkomarenko30@gmail.com,testuser@coachos.test
```

Do not add Supabase `service_role` or secret keys. CoachOS only needs the public Supabase URL and anon key for this frontend app.

For QA with a separate test account, see `docs/TEST_USER_SETUP.md`. After updating `ALLOWED_EMAILS` in Vercel, redeploy the project.

## Supabase Auth Settings

In Supabase Dashboard, open Authentication settings.

Set Site URL to the production Vercel URL:

```text
https://<production-domain>
```

Add Redirect URLs:

```text
https://<production-domain>/auth/callback
https://<preview-domain>/auth/callback
http://localhost:3000/auth/callback
```

The preview callback is optional but useful when testing Vercel preview deployments.

Disable public signup in Supabase Dashboard:

```text
Authentication -> Providers/Settings -> Allow new users to sign up -> Off
```

CoachOS also blocks signup server-side through `REGISTRATION_ENABLED=false`.

## GitHub And Vercel Workflow

- Push to `main` creates a production deployment.
- Branches and pull requests create preview deployments.
- Before merging or pushing to production, run local QA and checks.

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## QA Checklist

### Login

1. Set `ALLOWED_EMAILS` to the allowed trainer email.
2. Deploy to Vercel.
3. Open `/login`.
4. Sign in with the allowed email.
5. Confirm `/dashboard` opens.

### Allowlist

1. Sign in with an email that is not in `ALLOWED_EMAILS`.
2. Confirm the app logs the user out.
3. Confirm the app redirects to `/login` with an access error.
4. Try opening `/dashboard`, `/clients`, `/calendar`, and `/sessions/...`.
5. Confirm protected routes do not open.

If `ALLOWED_EMAILS` is empty locally, CoachOS allows all emails for development. If it is empty in production, CoachOS denies access to avoid accidentally opening the preview.

### Closed Registration

1. Open `/login`.
2. Confirm there is no public `Create account` link.
3. Open `/register`.
4. Confirm it shows `Регистрация временно закрыта`.
5. Confirm no signup form is shown.
6. Keep `REGISTRATION_ENABLED=false` in Vercel.

## Known Limitations

- There is no invite system yet.
- There is no admin panel for managing allowed emails.
- Updating the allowlist is done through Vercel environment variables.
- Supabase Auth users may still exist from earlier local or preview testing, but CoachOS protected routes are blocked by the server-side allowlist.

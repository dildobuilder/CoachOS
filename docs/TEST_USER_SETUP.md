# Test User Setup

CoachOS private preview uses an email allowlist and closed registration. A separate test user keeps QA data away from the primary trainer account.

## Test Account

Use this email for QA:

```text
testuser@coachos.test
```

The QA password is intentionally not committed to the repository. Set it locally through `TEST_USER_PASSWORD`.

## Recommended Script Flow

The local script creates the user through the Supabase Admin API and confirms the email immediately.

Required local-only env variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TEST_USER_EMAIL=testuser@coachos.test
TEST_USER_PASSWORD=
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is only for local admin scripts.
- Never expose the service role key in frontend code.
- Never add the service role key to Vercel public/client env variables.
- Never commit `.env.local`.
- Keep `REGISTRATION_ENABLED=false`.

Run:

```bash
pnpm create:test-user
```

The script:

- loads `.env.local` and `.env` if present;
- checks whether the email already exists;
- creates the Supabase Auth user if missing;
- sets `email_confirm: true`;
- prints the email, user id, and allowlist reminder.

## Allowlist

For Vercel private preview, set:

```env
ALLOWED_EMAILS=mkomarenko30@gmail.com,testuser@coachos.test
```

After changing Vercel environment variables, redeploy the project.

For local QA, `.env.local` can also contain:

```env
ALLOWED_EMAILS=mkomarenko30@gmail.com,testuser@coachos.test
```

## Manual Supabase Dashboard Flow

If you do not want to use the script:

1. Open Supabase Dashboard.
2. Go to Authentication.
3. Open Users.
4. Add a user.
5. Email: `testuser@coachos.test`.
6. Password: use the QA password shared outside the repository.
7. Mark the email as confirmed if Supabase shows that option.
8. Add `testuser@coachos.test` to `ALLOWED_EMAILS`.
9. Redeploy Vercel after changing env variables.

## Verify Login

1. Confirm `REGISTRATION_ENABLED=false`.
2. Confirm `ALLOWED_EMAILS` includes `testuser@coachos.test`.
3. Redeploy Vercel if env variables changed.
4. Open `/login`.
5. Sign in as `testuser@coachos.test`.
6. Confirm `/dashboard` opens.
7. Create test data only under this account.

## Why Public Registration Stays Closed

The private preview is not a public SaaS launch. Public registration remains disabled in UI, server actions, Supabase settings, and Vercel env with:

```env
REGISTRATION_ENABLED=false
```

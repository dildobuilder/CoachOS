# CoachOS Implementation Plan

## 1. Final Tech Stack

CoachOS MVP will be implemented as a single Next.js application.

- Framework: Next.js App Router
- Language: TypeScript
- Auth: Supabase Auth
- Database: PostgreSQL via Supabase
- Migrations: Supabase SQL migrations
- Database types: generated Supabase types
- Styling: Tailwind CSS
- UI kit: shadcn/ui-style local components
- Deployment: Vercel later
- Package manager: pnpm recommended
- ORM: none in Sprint 1A/1B

## 2. Architecture Decisions

- Use a single-app repository, not a monorepo.
- Use Supabase as backend platform for auth, database, migrations, and RLS.
- Keep business logic in domain-oriented `features/` folders.
- Use server actions for authenticated mutations where practical.
- Use server components for initial data loading on protected pages.
- Use client components only for interactive forms and UI state.
- Store `trainer_profiles.id` as the same UUID as `auth.users.id`.
- Every trainer-owned business table must include `trainer_id`.
- MVP has no client login. A client is a trainer-owned record, not an auth user.
- Physical delete is avoided for clients. Use `status = 'archived'`.
- Sprint 1 focuses only on the vertical slice: trainer auth -> client -> event -> session -> history.
- No Drizzle ORM, no separate backend service, no external public API in Sprint 1.

## 3. Repository Structure

```txt
coachos/
  app/
  components/
  features/
  lib/
  supabase/
  docs/
```

The repository starts as a single Next.js app with domain folders under `features/`.

## 4. Sprint 1A Scope

- Scaffold Next.js App Router project.
- Configure TypeScript.
- Configure Tailwind CSS.
- Install and configure shadcn/ui-style primitives.
- Configure Supabase browser client.
- Configure Supabase server client.
- Configure auth middleware for protected routes.
- Add Supabase Auth login/register flow.
- Add `trainer_profiles` migration.
- Add `clients` migration.
- Add RLS policies for `trainer_profiles`.
- Add RLS policies for `clients`.
- Add generated Supabase database types.
- Create protected app layout.
- Create clients list page.
- Create client creation page.
- Create client edit page.
- Create client profile page.
- Implement client archive action.

Sprint 1A does not include calendar or workouts.

## 5. Sprint 1B Scope

- Add `calendar_events`, `workout_sessions`, `session_exercises`, and `session_sets`.
- Add RLS policies for Sprint 1B tables.
- Create day dashboard and day calendar.
- Create training event flow.
- Start workout from event.
- Add exercises and sets to a workout session.
- Complete session and show it in client history.

## 6. Database Migration Plan

Migration order:

1. `trainer_profiles`
2. `clients`
3. `calendar_events`
4. `workout_sessions`
5. `session_exercises`
6. `session_sets`

Sprint 1A implements only `trainer_profiles` and `clients`.

## 7. RLS Plan

Enable RLS on every app table.

- `trainer_profiles`: users can select, insert, and update only `id = auth.uid()`.
- `clients`: trainers can select, insert, and update only rows where `trainer_id = auth.uid()`.
- Do not expose physical delete policies for clients in MVP.

## 8. Frontend Pages / Routes

Public/auth:

- `/login`
- `/register`
- `/auth/callback`

Protected:

- `/dashboard`
- `/clients`
- `/clients/new`
- `/clients/[clientId]`
- `/clients/[clientId]/edit`
- `/clients/[clientId]/history`
- `/calendar`
- `/sessions/[sessionId]`

Sprint 1A implements auth, dashboard placeholder, clients list, create, edit, archive, and profile.

## 9. Feature Folders

- `features/auth`
- `features/trainer`
- `features/clients`
- `features/calendar`
- `features/workouts`

Sprint 1A implements `auth`, `trainer`, and `clients`.

## 10. Components To Create

Layout:

- `AppShell`
- `ProtectedNav`
- `MobileBottomNav`
- `PageHeader`
- `EmptyState`
- `SubmitButton`
- `FormError`

Sprint 1A:

- `LoginForm`
- `RegisterForm`
- `ClientList`
- `ClientForm`
- `ClientProfileSummary`
- `ClientStatusBadge`
- `ArchiveClientButton`

Sprint 1B:

- `TodayDashboard`
- `DayCalendar`
- `EventCard`
- `EventForm`
- `StartWorkoutButton`
- `SessionEditor`
- `AddExerciseForm`
- `SessionExerciseCard`
- `AddSetForm`
- `CompleteSessionButton`
- `ClientSessionHistory`

## 11. Server Actions / Route Handlers To Create

Sprint 1A:

- `signInWithPassword`
- `signUpWithPassword`
- `signOut`
- `ensureTrainerProfile`
- `createClient`
- `updateClient`
- `archiveClient`
- `restoreClient`
- `/auth/callback`

Sprint 1B:

- `createCalendarEvent`
- `updateCalendarEvent`
- `cancelCalendarEvent`
- `startWorkoutFromEvent`
- `addExerciseToSession`
- `updateSessionExercise`
- `deleteSessionExercise`
- `addSetToExercise`
- `updateSessionSet`
- `deleteSessionSet`
- `completeWorkoutSession`

## 12. Acceptance Criteria For Sprint 1A

- A new trainer can register.
- A trainer can log in.
- A trainer can log out.
- Protected routes redirect unauthenticated users to `/login`.
- Authenticated users can access protected routes.
- A `trainer_profiles` row exists for the authenticated trainer.
- A trainer can create a client.
- A trainer can see their clients list.
- A trainer can open a client profile.
- A trainer can edit a client.
- A trainer can archive a client.
- Archived clients no longer appear in the default active clients list.
- RLS prevents access to another trainer's profile and clients.
- Generated Supabase database types are committed.
- Basic form validation exists for required client fields.
- The UI works on mobile viewport.

## 13. Acceptance Criteria For Sprint 1B

- A trainer can open `/dashboard` and see today's date and events.
- A trainer can create a client training event.
- A trainer can start a workout from a scheduled client training event.
- A trainer can add exercises and sets.
- A trainer can complete the workout session.
- A completed session appears in client history.
- RLS prevents access to another trainer's events and workout data.
- The active session page is usable on a phone.

## 14. Risks And Mitigations

- MVP growth: keep Sprint 1A/1B locked to vertical slice.
- Calendar complexity: use a simple day layout first.
- Workout input speed: use minimal free-text exercise and set entry.
- Ownership bugs: add `trainer_id` everywhere and enable RLS immediately.
- Schema evolution: separate session facts from future planned templates.
- Auth/profile mismatch: use `trainer_profiles.id = auth.users.id`.
- Desktop-first UX: test mobile viewport before accepting.

## 15. Exact Next Codex Task After This Document

Implement Sprint 1A only. Scaffold the Next.js App Router application with TypeScript, Tailwind CSS, shadcn/ui, Supabase client/server setup, Supabase Auth, `trainer_profiles` and `clients` SQL migrations with RLS, generated Supabase database types, protected routes, login/register pages, clients list, create client, edit client, archive client, and client profile. Do not implement calendar or workout sessions yet.

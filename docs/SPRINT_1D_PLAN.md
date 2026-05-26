# Sprint 1D - Seeded Exercise Base & Muscle Group Selector

## Goal

Sprint 1D replaces the primary free-text exercise entry flow with a CoachOS seeded exercise base.

Main flow:

1. Trainer opens an active workout session.
2. Trainer chooses a muscle group/category.
3. Trainer selects an exercise from the CoachOS base.
4. Exercise is added to the current session with a stable name snapshot.
5. If the exercise is missing, trainer can create a custom exercise and add it immediately.

## Source Workbook

Source file: `CoachOS_Sprint_1D_Exercise_Base_v1.xlsx`

Main sheet: `Exercises`

Imported rows:

- `status = active`
- `review_status = draft` does not block Sprint 1D seed import.

Seed result:

- 82 active system exercises.
- 78 rows had a consistent source-column shift after `synergists`; these were normalized during SQL seed generation.
- 0 rows required unsafe intensity fallback.

## Database Model

New table: `public.exercises`

Supports:

- `system` exercises with `trainer_id = null`;
- `custom` exercises with `trainer_id = auth.uid()`.

Important fields:

- `source_type`;
- `exercise_key`;
- `name`;
- `primary_category`;
- `secondary_categories`;
- `agonists`;
- `synergists`;
- `antagonists`;
- `equipment`;
- `movement_pattern`;
- `default_intensity_type`;
- `short_description`;
- `status`.

System exercise uniqueness:

- partial unique index on `exercise_key` where `source_type = 'system'`.

## Seed Strategy

Seed is stored in the SQL migration.

Rules:

- `source_type = 'system'`;
- `trainer_id = null`;
- `status = 'active'`;
- semicolon-separated Excel fields become `text[]`;
- seed is idempotent through `on conflict ... do update`.

## RLS

RLS is enabled on `public.exercises`.

Policies:

- select active system exercises and own custom exercises;
- insert only own custom exercises;
- update only own custom exercises;
- no physical delete flow in UI.

## Session Exercise Changes

`public.session_exercises` now has:

- `exercise_id uuid references public.exercises(id) on delete set null`;
- `name_snapshot text not null`.

Backfill:

- existing `name_snapshot` is filled from existing `name`.

Display rule:

- session/history UI should use `name_snapshot` first and fallback to `name`.

## UX Flow

Active session page now uses library-first exercise selection:

- category chips;
- search;
- exercise cards;
- add from library;
- custom exercise form;
- legacy free-text form as fallback only.

No `/exercises` management page is included in Sprint 1D.

## Not In Sprint 1D

- program templates;
- planned sets;
- progression;
- AI;
- exercise media;
- analytics;
- rest timer;
- nutrition;
- body weight logs;
- client portal;
- Sprint 1E features.

## Sprint 1E Backlog

Potential next step:

- dedicated exercise management page;
- review/approve exercise base;
- richer exercise taxonomy;
- exercise media;
- program templates and planned sets.

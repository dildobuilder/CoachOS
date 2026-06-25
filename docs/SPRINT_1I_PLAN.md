# Sprint 1I - Plan vs Actual Review

## Goal

Add the first read-only plan vs actual review layer for completed workout sessions linked to a planned workout.

## Strict Scope

- No migrations.
- No new tables.
- No RLS changes.
- No server actions.
- No database writes.
- No charts, tonnage, PR detection, adherence score, progression logic, AI recommendations, or dashboard work.

## Data Sources

Plan source:

- `planned_workouts`
- `planned_exercises`
- `planned_sets`

Actual source:

- `workout_sessions`
- `session_exercises`
- `session_sets`

Matching uses only existing ids:

- `workout_sessions.planned_workout_id`
- `session_exercises.planned_exercise_id`
- `session_sets.planned_set_id`

No matching by name, order, or `exercise_id`.

## Matching Rules

Exercise statuses:

- `matched`: linked exercise, all planned sets matched, no extra actual sets, key values equal.
- `changed`: linked exercise with a value delta, missing planned set, extra actual set, or exercise intensity type delta.
- `added`: actual exercise has no planned link.
- `missed`: planned exercise has no actual link.

Set statuses:

- `matched`: linked set and key values equal.
- `changed`: linked set with weight, reps, or intensity value delta.
- `added`: actual set has no planned link.
- `missed`: planned set has no actual link.

Notes are displayed as information only and do not change status.

## UI Behavior

The session page renders a compact `План / факт` block only for completed sessions with `planned_workout_id`.

Each exercise shows:

- exercise name;
- status badge;
- planned sets;
- actual sets;
- simple deltas such as `100 кг -> 105 кг`, `8 повт. -> 10 повт.`, `RIR 2 -> RIR 1`.

Empty states:

- no `planned_workout_id`: render nothing;
- linked plan without planned exercises: `В плане не было упражнений`;
- completed linked session with no actual exercises: planned exercises show `Не выполнено`;
- legacy sessions without planned ids show conservative `Добавлено` / limited review.

## Known Limitations

- No name-based matching.
- No analytics or charts.
- No tonnage.
- No PR detection.
- No adherence score.
- Legacy sessions without planned ids may show limited review.

## QA Checklist

1. Complete a planned workout without changes and verify `По плану`.
2. Change weight/reps/intensity before completion and verify `Изменено`.
3. Add an extra set and verify it appears as an extra actual set.
4. Delete or skip a planned set and verify missed planned set display.
5. Add a manual/free-text exercise and verify `Добавлено`.
6. Open a completed session not linked to a planned workout and verify the page still works.
7. Open an active linked session and verify no final `Не выполнено` conclusions are shown.
8. Verify calendar -> start workout -> complete -> history still works.
9. Verify exercise library add-to-session still works.
10. Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

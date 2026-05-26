# Sprint 1D Update - Exercise Base Polish

## Problems Found After QA

- Special exercises from `Кардио`, `Мобилити`, and `ОФП / Плиометрика` appeared in strength categories because filtering used `secondary_categories` too broadly.
- The intensity model did not support duration-based work.
- Active session cards did not show muscle data from linked library exercises.

## Special Categories

Special categories:

- `Кардио`
- `Мобилити`
- `ОФП / Плиометрика`

Rules:

- special-category exercises appear only in their own primary category;
- they do not appear in `Ноги`, `Грудь`, `Спина`, `Плечи`, `Руки`, or `Кор` because of involved muscles;
- strength exercises can still appear in multiple strength categories through `primary_category` and `secondary_categories`.

## Category Filtering

For strength categories:

- include exercises where `primary_category` matches;
- include exercises where `secondary_categories` contains the category;
- exclude exercises whose `primary_category` is special.

For special categories:

- include only exercises whose `primary_category` matches the special category.

## Intensity Type `time`

Added intensity type:

- `time`

Meaning:

- duration/time under load.

Storage:

- `session_sets.intensity_value` stores seconds.

Validation:

- `time` must be a positive integer number of seconds.

Display examples:

- `30 сек`
- `60 сек`
- `2 мин`
- `10 мин`

## Default Intensity Rules

System exercises are corrected by migration:

- `rpe` only for selected base movements:
  - back squat;
  - front squat;
  - classic deadlift;
  - sumo deadlift;
  - barbell bench press.
- `time` for `Кардио`, `Мобилити`, `ОФП / Плиометрика`.
- `rir` for other strength exercises.

## UI Changes

- `time` appears in intensity selectors.
- Set form shows `Время, сек` for time-based exercises.
- Completed/readonly session displays time human-readably.
- Session exercise card shows library muscle data:
  - agonists;
  - synergists;
  - antagonists.

## Manual QA

Check:

1. `Ноги` does not show treadmill, bike, rowing machine, jump rope, stepper, or 90/90.
2. Cardio exercises appear in `Кардио`.
3. 90/90 appears in `Мобилити`.
4. Cardio/mobility/GPP exercises default to `time`.
5. Base movements default to `rpe`.
6. Other strength exercises default to `rir`.
7. Time-based set form shows `Время, сек`.
8. Added library exercise card shows muscle data.
9. Old completed session history still opens.
10. `pnpm typecheck` passes.
11. `pnpm lint` passes.

## Mobility Polish Correction

After QA, mobility was separated from duration-based work:

- `Мобилити` defaults to `none`, not `time`.
- `Кардио` and `ОФП / Плиометрика` keep `time`.
- Mobility exercises added from the library create one completed empty set automatically.
- Mobility cards hide intensity selection, weight, reps, time, RPE, RIR, and percent inputs.
- Existing linked mobility session exercises are corrected to `intensity_type = 'none'` by `202605260002_exercise_base_polish.sql`.
- Existing mobility sets have load/reps/intensity values cleared by the same migration.

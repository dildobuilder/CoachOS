# CoachOS Architecture

## 1. Overview проекта

CoachOS - рабочая система для персонального тренера. Продукт помогает вести клиентов, планировать тренировки, запускать тренировочные сессии, фиксировать фактические подходы и сохранять историю работы с клиентом.

Основная проблема, которую решает CoachOS: тренеру нужен единый контур `клиент -> расписание -> тренировка -> упражнения -> подходы -> история`, без разрозненных таблиц, заметок и ручного копирования программ.

Текущая стадия продукта: private preview / pre-release. Приложение развернуто на Vercel, публичная регистрация закрыта, доступ ограничен allowlist email через Supabase Auth.

## 2. Tech Stack

- **Next.js 14 App Router** - маршруты в `app/`, server components, server actions.
- **TypeScript** - строгая типизация доменной логики и UI.
- **Supabase** - PostgreSQL, Auth, Row Level Security, generated DB types.
- **Supabase SSR** - server/client auth helpers для App Router.
- **Tailwind CSS** - основная стилизация интерфейса.
- **shadcn-style UI primitives** - локальные компоненты `Button`, `Input`, `Select`, `Textarea` и похожий composition-подход.
- **Zod** - server-side validation форм и action payloads.
- **Vercel** - production/private preview deployment.
- **pnpm** - package manager and scripts:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`

## 3. Core Architecture

CoachOS построен вокруг двух связанных контуров: фактической тренировки и планирования.

### Основной тренировочный pipeline

```text
Clients
  -> Calendar Events
  -> Workout Sessions
  -> Session Exercises
  -> Session Sets
  -> Completed History
```

Роли сущностей:

- `clients` - клиентская база тренера.
- `calendar_events` - временные слоты и события календаря тренера.
- `workout_sessions` - факт проведения тренировки.
- `session_exercises` - упражнения внутри фактической сессии.
- `session_sets` - выполненные подходы.

Календарь отвечает за планирование времени. Сессия отвечает за факт тренировки. История строится из completed `workout_sessions`, а не из календаря.

### Exercise library pipeline

```text
Exercises
  -> Session Exercises
  -> Planned Exercises
  -> Pattern Exercises
  -> Template Exercises
```

`exercises` - база упражнений CoachOS. Есть системные упражнения (`source_type = system`) и кастомные упражнения тренера (`source_type = custom`). При добавлении упражнения в тренировку сохраняется `exercise_id` и `name_snapshot`, чтобы история не ломалась при будущем переименовании упражнения.

### Planning pipeline

```text
Training Plan Templates
  -> Training Plans
  -> Training Plan Patterns
  -> Planned Workouts
  -> Planned Exercises / Planned Sets
  -> Calendar Event
  -> Workout Session
```

Планирование отделено от факта:

- `training_plans` - план клиента на период.
- `training_plan_patterns` - повторяемые структуры внутри плана, например `A - Ноги`, `B - Верх`.
- `planned_workouts` - конкретные тренировки на даты, но не обязательно на время.
- `planned_exercises` / `planned_sets` - что запланировано.
- `calendar_events` - реальный временной слот тренера.
- `workout_sessions` - что фактически проведено.

Пока `planned_workout` не получил время, он виден в клиентском календаре, но не появляется в общем календаре тренера. После назначения времени создается `calendar_event`, а при старте тренировки создается prefilled `workout_session`.

### Module layout

Основные модули находятся в `features/`:

- `features/auth` - login/register actions and forms.
- `features/trainer` - профиль тренера.
- `features/clients` - клиенты и профиль клиента.
- `features/calendar` - общий календарь, события, старт тренировки из события.
- `features/workouts` - workout session editor, exercises, sets, completion flow.
- `features/exercises` - seeded/custom exercise base.
- `features/client-logs` - дневные логи клиента, вес, КБЖУ, клиентский календарь.
- `features/planning` - training plans, planned workouts, patterns, templates.

## 4. Database Schema (Supabase)

Все ключевые пользовательские таблицы защищены RLS. Основной ownership-паттерн: `trainer_id = auth.uid()`, плюс проверки владения клиентом через `clients`, где это важно.

### Core tables

| Table | Purpose | Key relations |
| --- | --- | --- |
| `trainer_profiles` | Профиль тренера, один профиль на Supabase Auth user. | `id = auth.uid()` |
| `clients` | Клиенты тренера, статус, цель, уровень, контакты, ограничения, стартовый вес. | `trainer_id -> trainer_profiles.id` |
| `calendar_events` | Единый источник событий календаря тренера: training, personal, break, other. | `trainer_id`, optional `client_id` |
| `workout_sessions` | Фактическая тренировочная сессия: active/completed, связанная с клиентом и опционально событием. | `client_id`, `calendar_event_id`, optional `planned_workout_id` |
| `session_exercises` | Упражнения внутри фактической сессии. | `session_id`, optional `exercise_id`, optional `planned_exercise_id` |
| `session_sets` | Подходы внутри фактического упражнения. | `session_exercise_id`, optional `planned_set_id` |

Important relationship:

```text
calendar_events.id <- workout_sessions.calendar_event_id
```

В `calendar_events` нет `workout_session_id`. Для UI existing session вычисляется query по `workout_sessions.calendar_event_id`. Это снижает риск рассинхронизации.

### Exercise tables

| Table | Purpose | Notes |
| --- | --- | --- |
| `exercises` | Системная и кастомная база упражнений. | `system` доступен всем, `custom` принадлежит тренеру. |
| `session_exercises.exercise_id` | Ссылка на упражнение из базы. | Nullable для legacy/manual exercises. |
| `session_exercises.name_snapshot` | Снимок имени упражнения на момент добавления. | Используется для стабильной истории. |

Intensity types в текущей модели:

```text
none | rpe | rir | percent | time
```

`time` хранится в `intensity_value` в секундах. Для mobility-упражнений используется `none`, без метрик и с компактным completed-подходом.

### Client logs

| Table | Purpose | Key rules |
| --- | --- | --- |
| `client_daily_logs` | Дневной лог клиента: вес, calories, protein, fat, carbs, notes. | `unique (client_id, log_date)` |
| `clients.starting_weight` | Стартовый вес клиента. | Текущий вес вычисляется из последнего non-null `body_weight`. |

`client_daily_logs` не создает отдельный календарь. Это дневные данные, которые отображаются рядом с клиентскими событиями и planned workouts.

### Planning tables

| Table | Purpose | Notes |
| --- | --- | --- |
| `training_plans` | План клиента на период. | Status: active/inactive/completed/archived в текущей рабочей схеме. |
| `planned_workouts` | Тренировка на дату без обязательного времени. | Optional `calendar_event_id`, optional `pattern_id`. |
| `planned_exercises` | Запланированные упражнения planned workout. | Materialized copy, не live reference на pattern/template. |
| `planned_sets` | Запланированные подходы. | Копируются в `session_sets` при старте. |
| `training_plan_patterns` | A/B/C паттерны внутри клиентского плана. | Например `A - Ноги`. |
| `pattern_exercises` | Упражнения паттерна. | Источник для materialized planned workouts. |
| `pattern_sets` | Подходы паттерна. | Источник для planned sets. |
| `training_plan_templates` | System/custom шаблоны плана. | Templates являются источниками, не мутируют созданные планы. |
| `template_patterns` | Паттерны шаблона. | Копируются в plan patterns. |
| `template_exercises` | Упражнения шаблона. | Копируются в pattern exercises. |
| `template_sets` | Подходы шаблона. | Копируются в pattern sets. |

Плановая модель использует materialized copy:

```text
template -> pattern -> planned -> session
```

После копирования изменение template не меняет уже созданный клиентский план. Изменение pattern не перезаписывает started/completed planned workouts автоматически.

## 5. Training Flow

### 1. Создание клиента

Тренер создает клиента в `/clients`. Клиент получает `trainer_id`, статус, цель, уровень, ограничения, травмы и дополнительные поля профиля.

### 2. Планирование тренировки в календаре

Тренер создает `calendar_event` в `/calendar` или из клиентского контекста. Для `client_training` у события есть `client_id`, дата/время, duration, status и type.

Conflict detection выполняется на уровне server actions:

```text
new.starts_at < existing.ends_at
and
new.ends_at > existing.starts_at
and
existing.status != cancelled
```

### 3. Создание workout session из calendar event

Старт тренировки идет через единый entrypoint `startWorkoutFromEvent`. Он:

- проверяет, нет ли уже session для `calendar_event_id`;
- если session уже есть, открывает ее;
- если session нет, создает `workout_session`;
- если event связан с `planned_workout`, prefill делает копию planned exercises/sets в session exercises/sets.

Duplicate protection держится на `workout_sessions.calendar_event_id`.

### 4. Добавление exercises

В active session основной сценарий - выбор из базы упражнений:

```text
category -> exercise card -> add to session
```

При добавлении сохраняются:

- `exercise_id`, если упражнение из базы;
- `name_snapshot`;
- `intensity_type` по умолчанию из exercise;
- optional description/muscle data для отображения.

Manual/free-text exercise остается fallback-сценарием для конкретной сессии.

### 5. Добавление sets

Подходы хранятся в `session_sets`. Для live session, planned workouts и patterns поддерживается bulk-add одинаковых подходов: тренер вводит параметры один раз и выбирает количество подходов.

Фактические set-поля:

- weight;
- reps;
- intensity value;
- notes;
- completed flag.

Для `time` intensity значение хранится в секундах.

### 6. Завершение тренировки

При завершении session становится completed. Связанный calendar event становится completed. Если session была создана из planned workout, planned workout также переводится в completed.

### 7. История и анализ

История клиента строится из completed `workout_sessions`. Completed session открывается в readonly mode. План-факт аналитика пока не реализована, но связи `planned_workout_id`, `planned_exercise_id`, `planned_set_id` уже сохраняют основу для будущего сравнения.

## 6. Sprint History

### Sprint 1A - Foundation

- Базовая архитектура Next.js App Router.
- Supabase Auth.
- `trainer_profiles`.
- Protected layout and initial private workspace foundation.

### Sprint 1B - Calendar and Workout Session Core

- Клиенты.
- Базовые calendar events.
- Workout sessions.
- Session exercises and sets.
- Start workout from event.
- Complete session.
- Client history.

### Sprint 1C - Calendar Core v2 and UI Stability

- Weekly calendar grid.
- Click-to-create event flow.
- Duration in whole hours.
- Event types and colors.
- Conflict detection.
- Existing session open/continue behavior.
- Dashboard remains today-focused.
- Mobile/modal/calendar polish followed later in Sprint 1E-0B.

### Sprint 1D - Seeded Exercise Base

- `exercises` table with system/custom model.
- Seeded CoachOS exercise base.
- Category selector.
- Add exercise from library to active session.
- `exercise_id` and `name_snapshot` on `session_exercises`.
- Intensity model updates including `time`.
- Mobility-specific behavior.

### Sprint 1E-0 - Private Preview Deployment

- Vercel deployment preparation.
- `.env.example`.
- Public registration closed in UI and server actions.
- Server-side email allowlist.
- Protected layout and middleware allowlist checks.
- Test user setup documentation/script.

### Sprint 1E - Client Calendar and Daily Logs

- Client-specific calendar projection.
- `client_daily_logs`.
- `clients.starting_weight`.
- Daily weight and КБЖУ logs.
- Current weight derived from latest non-null daily log.
- Schedule client training while preserving main `calendar_events` source of truth.

### Sprint 1F - Training Plans and Planned Workouts

- `training_plans`.
- `planned_workouts`.
- `planned_exercises`.
- `planned_sets`.
- Planned workouts without time.
- Scheduling planned workouts into `calendar_events`.
- Start scheduled planned workout as prefilled session.

### Sprint 1F-b / 1F-b2 - Patterns, Templates, Plan Management

- A/B/C workout patterns.
- Pattern exercises and sets.
- Pattern materialization into planned workouts.
- Reusable system/custom training plan templates.
- Create plan from template.
- Save client plan as template.
- Previous completed workout by same pattern.
- Archive/delete training plan behavior.
- Active plan management and plan editing are being developed in the current working state.

## 7. Current System State

Текущая версия CoachOS умеет:

- авторизовать тренера через Supabase Auth;
- ограничивать private preview по allowlist email;
- создавать и вести клиентов;
- показывать dashboard сегодняшних событий;
- показывать общий weekly calendar тренера;
- создавать, редактировать и конфликтно проверять calendar events;
- запускать и продолжать workout session из события;
- добавлять упражнения из CoachOS exercise base;
- создавать custom exercises;
- добавлять один или несколько подходов за раз;
- завершать session и открывать completed history readonly;
- вести client daily logs;
- показывать клиентский календарь как projection событий, планов и дневных данных;
- создавать training plans and planned workouts;
- назначать planned workout на время через calendar event;
- prefill session из planned exercises/sets;
- работать с A/B/C patterns;
- создавать планы из templates и сохранять plans as custom templates.

Что еще развивается:

- UX редактирования активного training plan.
- Правило одного active plan на клиента.
- Более зрелое управление планами без ломки проведенных тренировок.
- Будущая plan-vs-actual аналитика.

## 8. Key Design Principles

### One source of truth

- Timed trainer calendar lives in `calendar_events`.
- Actual workout lives in `workout_sessions`.
- Planned workout lives in `planned_workouts`.
- Templates are sources, not live parents of client plans.

### Не дублировать таблицы без необходимости

Клиентский календарь не имеет отдельной таблицы events. Он строится как projection:

```text
calendar_events filtered by client_id
+ planned_workouts
+ client_daily_logs
```

### Расширять, а не переписывать

Новые спринты добавляют слой поверх существующей модели:

- exercise library добавила `exercise_id` and `name_snapshot`, но legacy free-text exercises остались совместимыми;
- planning добавил planned links, но старый start session flow остался единым entrypoint;
- templates копируются в plans, не ломая existing client plans.

### Snapshot для истории

История должна оставаться стабильной. Поэтому session/planned/pattern/template exercise layers используют `name_snapshot`. Если упражнение в базе будет переименовано, старая тренировка сохранит старое имя.

### RLS-first

Данные тренера защищаются на уровне Supabase RLS. В таблицах используется `trainer_id`, а для клиентских данных дополнительно проверяется, что `client_id` принадлежит текущему тренеру.

### Server actions own business logic

Критичная логика находится на server side:

- validation;
- conflict detection;
- session duplicate protection;
- planned -> session prefill;
- archive/update flows;
- registration and allowlist protection.

UI-компоненты должны оставаться thin layer над actions/queries.

### Sprint-based development

CoachOS развивается вертикальными срезами. Каждый sprint должен сохранять уже работающий flow:

```text
calendar -> session -> exercises -> sets -> complete -> history
```

## 9. Future Direction

Ближайшее развитие логично продолжать вокруг планирования:

- завершить active plan management;
- улучшить редактирование плана без изменения completed workouts;
- сделать план-факт сравнение;
- добавить более удобное назначение patterns на недели;
- позже добавить drag-and-drop планирование;
- позже добавить автоматическую генерацию недельных циклов;
- позже расширить шаблоны и системные программы.

Важно: future features должны сохранять разделение `planned` и `actual`, не превращая `calendar_events` в единственный источник всей плановой логики.

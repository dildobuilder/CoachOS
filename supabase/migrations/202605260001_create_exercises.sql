create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainer_profiles(id) on delete cascade,
  source_type text not null check (source_type in ('system', 'custom')),
  exercise_key text,
  name text not null,
  primary_category text not null,
  secondary_categories text[] not null default array[]::text[],
  agonists text[] not null default array[]::text[],
  synergists text[] not null default array[]::text[],
  antagonists text[] not null default array[]::text[],
  equipment text,
  movement_pattern text,
  default_intensity_type text not null default 'none' check (default_intensity_type in ('none', 'rpe', 'rir', 'percent')),
  short_description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (source_type = 'system' and trainer_id is null and exercise_key is not null)
    or
    (source_type = 'custom' and trainer_id is not null)
  )
);

create unique index if not exists exercises_system_exercise_key_unique
on public.exercises(exercise_key)
where source_type = 'system' and exercise_key is not null;

create index if not exists exercises_category_idx on public.exercises(primary_category);
create index if not exists exercises_trainer_source_status_idx on public.exercises(trainer_id, source_type, status);

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;

create policy "exercises_select_system_or_own"
on public.exercises for select
using (
  (source_type = 'system' and status = 'active')
  or trainer_id = auth.uid()
);

create policy "exercises_insert_own_custom"
on public.exercises for insert
with check (source_type = 'custom' and trainer_id = auth.uid());

create policy "exercises_update_own_custom"
on public.exercises for update
using (source_type = 'custom' and trainer_id = auth.uid())
with check (source_type = 'custom' and trainer_id = auth.uid());

alter table public.session_exercises
add column if not exists exercise_id uuid references public.exercises(id) on delete set null,
add column if not exists name_snapshot text;

update public.session_exercises
set name_snapshot = name
where name_snapshot is null;

alter table public.session_exercises
alter column name_snapshot set not null;

create index if not exists session_exercises_exercise_id_idx on public.session_exercises(exercise_id);

insert into public.exercises (trainer_id, source_type, exercise_key, name, primary_category, secondary_categories, agonists, synergists, antagonists, equipment, movement_pattern, default_intensity_type, short_description, status)
values
  (null, 'system', 'prised_so_shtangoy_na_spine', 'Присед со штангой на спине', 'Ноги', array['Кор']::text[], array['квадрицепсы', 'ягодичные']::text[], array['приводящие', 'разгибатели спины', 'мышцы кора']::text[], array[]::text[], 'Штанга', 'Присед', 'rpe', 'Базовое приседательное движение для силы ног и корпуса.', 'active'),
  (null, 'system', 'frontalnyy_prised', 'Фронтальный присед', 'Ноги', array['Кор']::text[], array['квадрицепсы', 'ягодичные']::text[], array['верх спины', 'мышцы кора']::text[], array[]::text[], 'Штанга', 'Присед', 'rpe', 'Присед с акцентом на квадрицепсы и вертикальное положение корпуса.', 'active'),
  (null, 'system', 'goblet_prised', 'Гоблет-присед', 'Ноги', array['Кор']::text[], array['квадрицепсы', 'ягодичные']::text[], array['приводящие', 'мышцы кора']::text[], array[]::text[], 'Гантели', 'Присед', 'rpe', 'Простой вариант приседа с весом перед корпусом.', 'active'),
  (null, 'system', 'zhim_nogami', 'Жим ногами', 'Ноги', array[]::text[], array['квадрицепсы', 'ягодичные']::text[], array['приводящие', 'икроножные']::text[], array[]::text[], 'Тренажёр', 'Присед', 'rpe', 'Тренажёрное упражнение для ног с низкой технической сложностью.', 'active'),
  (null, 'system', 'razgibanie_nog_v_trenazhere', 'Разгибание ног в тренажёре', 'Ноги', array[]::text[], array['квадрицепсы']::text[], array[]::text[], array[]::text[], 'Тренажёр', 'Изоляция', 'rir', 'Изолированная работа на квадрицепсы.', 'active'),
  (null, 'system', 'sgibanie_nog_lezha', 'Сгибание ног лёжа', 'Ноги', array[]::text[], array['бицепс бедра']::text[], array['икроножные']::text[], array[]::text[], 'Тренажёр', 'Сгибание', 'rir', 'Изолированная работа на заднюю поверхность бедра.', 'active'),
  (null, 'system', 'rumynskaya_tyaga', 'Румынская тяга', 'Ноги', array['Спина']::text[], array['бицепс бедра', 'ягодичные']::text[], array['разгибатели спины', 'широчайшие', 'мышцы хвата']::text[], array[]::text[], 'Штанга', 'Тазовый шарнир', 'rpe', 'Тяговое движение с акцентом на заднюю поверхность бедра.', 'active'),
  (null, 'system', 'stanovaya_tyaga_klassicheskaya', 'Становая тяга классическая', 'Ноги', array['Спина', 'Кор']::text[], array['ягодичные', 'бицепс бедра', 'разгибатели спины']::text[], array['широчайшие', 'трапеции', 'мышцы кора', 'хват']::text[], array[]::text[], 'Штанга', 'Тазовый шарнир', 'rpe', 'Базовая тяга для общей силы задней цепи.', 'active'),
  (null, 'system', 'stanovaya_tyaga_sumo', 'Становая тяга сумо', 'Ноги', array['Спина', 'Кор']::text[], array['ягодичные', 'приводящие', 'квадрицепсы']::text[], array['бицепс бедра', 'разгибатели спины', 'широчайшие']::text[], array[]::text[], 'Штанга', 'Тазовый шарнир', 'rpe', 'Вариант тяги с широкой постановкой и акцентом на тазобедренные.', 'active'),
  (null, 'system', 'yagodichnyy_most_so_shtangoy', 'Ягодичный мост со штангой', 'Ноги', array['Кор']::text[], array['ягодичные']::text[], array['бицепс бедра', 'мышцы кора']::text[], array[]::text[], 'Штанга', 'Тазовый шарнир', 'rpe', 'Упражнение для акцента на разгибание бедра и ягодичные.', 'active'),
  (null, 'system', 'hip_trast_v_trenazhere', 'Хип-траст в тренажёре', 'Ноги', array['Кор']::text[], array['ягодичные']::text[], array['бицепс бедра', 'мышцы кора']::text[], array[]::text[], 'Тренажёр', 'Тазовый шарнир', 'rpe', 'Тренажёрный вариант разгибания бедра с акцентом на ягодичные.', 'active'),
  (null, 'system', 'bolgarskiy_split_prised', 'Болгарский сплит-присед', 'Ноги', array['Кор']::text[], array['квадрицепсы', 'ягодичные']::text[], array['приводящие', 'мышцы кора']::text[], array[]::text[], 'Гантели', 'Выпад', 'rpe', 'Одностороннее упражнение для ног, баланса и контроля таза.', 'active'),
  (null, 'system', 'vypady_nazad', 'Выпады назад', 'Ноги', array['Кор']::text[], array['квадрицепсы', 'ягодичные']::text[], array['приводящие', 'мышцы кора']::text[], array[]::text[], 'Гантели', 'Выпад', 'rpe', 'Выпады с меньшей ударной нагрузкой на колени.', 'active'),
  (null, 'system', 'podemy_na_noski_stoya', 'Подъёмы на носки стоя', 'Ноги', array[]::text[], array['икроножные']::text[], array['камбаловидные']::text[], array[]::text[], 'Тренажёр', 'Изоляция', 'rir', 'Изолированная работа на икроножные мышцы.', 'active'),
  (null, 'system', 'giperekstenziya', 'Гиперэкстензия', 'Ноги', array['Спина', 'Кор']::text[], array['ягодичные', 'бицепс бедра', 'разгибатели спины']::text[], array['мышцы кора']::text[], array[]::text[], 'Тренажёр', 'Тазовый шарнир', 'rpe', 'Разгибание корпуса для задней цепи и контроля поясницы.', 'active'),
  (null, 'system', 'zhim_shtangi_lezha', 'Жим штанги лёжа', 'Грудь', array['Руки', 'Плечи']::text[], array['большая грудная']::text[], array['трицепс', 'передняя дельта']::text[], array[]::text[], 'Штанга', 'Жим горизонтальный', 'rpe', 'Базовое жимовое движение для груди и трицепса.', 'active'),
  (null, 'system', 'zhim_ganteley_lezha', 'Жим гантелей лёжа', 'Грудь', array['Руки', 'Плечи']::text[], array['большая грудная']::text[], array['трицепс', 'передняя дельта', 'стабилизаторы плеча']::text[], array[]::text[], 'Гантели', 'Жим горизонтальный', 'rpe', 'Горизонтальный жим с большей свободой движения плеч.', 'active'),
  (null, 'system', 'zhim_shtangi_na_naklonnoy_skame', 'Жим штанги на наклонной скамье', 'Грудь', array['Плечи', 'Руки']::text[], array['верх грудных']::text[], array['передняя дельта', 'трицепс']::text[], array[]::text[], 'Штанга', 'Жим горизонтальный', 'rpe', 'Жимовой вариант с акцентом на верх грудных.', 'active'),
  (null, 'system', 'zhim_ganteley_na_naklonnoy_skame', 'Жим гантелей на наклонной скамье', 'Грудь', array['Плечи', 'Руки']::text[], array['верх грудных']::text[], array['передняя дельта', 'трицепс']::text[], array[]::text[], 'Гантели', 'Жим горизонтальный', 'rpe', 'Наклонный жим гантелей для груди и плечевого контроля.', 'active'),
  (null, 'system', 'otzhimaniya_ot_pola', 'Отжимания от пола', 'Грудь', array['Руки', 'Кор']::text[], array['большая грудная']::text[], array['трицепс', 'передняя дельта', 'мышцы кора']::text[], array[]::text[], 'Вес тела', 'Жим горизонтальный', 'rir', 'Базовое упражнение с собственным весом для верха тела.', 'active'),
  (null, 'system', 'razvedenie_ganteley_lezha', 'Разведение гантелей лёжа', 'Грудь', array['Плечи']::text[], array['большая грудная']::text[], array['передняя дельта']::text[], array[]::text[], 'Гантели', 'Изоляция', 'rir', 'Изолированное движение для грудных в растянутой позиции.', 'active'),
  (null, 'system', 'svedenie_ruk_v_krossovere', 'Сведение рук в кроссовере', 'Грудь', array['Плечи']::text[], array['большая грудная']::text[], array['передняя дельта']::text[], array[]::text[], 'Блок', 'Изоляция', 'rir', 'Блочное сведение рук с постоянным напряжением грудных.', 'active'),
  (null, 'system', 'zhim_v_trenazhere_sidya', 'Жим в тренажёре сидя', 'Грудь', array['Руки', 'Плечи']::text[], array['большая грудная']::text[], array['трицепс', 'передняя дельта']::text[], array[]::text[], 'Тренажёр', 'Жим горизонтальный', 'rpe', 'Стабильный тренажёрный жим для груди.', 'active'),
  (null, 'system', 'otzhimaniya_na_brusyah_s_grudnym_aktsentom', 'Отжимания на брусьях с грудным акцентом', 'Грудь', array['Руки', 'Плечи']::text[], array['нижняя часть грудных']::text[], array['трицепс', 'передняя дельта']::text[], array[]::text[], 'Вес тела', 'Жим горизонтальный', 'rpe', 'Брусья с наклоном корпуса для акцента на грудь.', 'active'),
  (null, 'system', 'podtyagivaniya_pryamym_hvatom', 'Подтягивания прямым хватом', 'Спина', array['Руки']::text[], array['широчайшие', 'большая круглая']::text[], array['бицепс', 'ромбовидные', 'нижняя трапеция']::text[], array[]::text[], 'Вес тела', 'Тяга вертикальная', 'rpe', 'Вертикальная тяга с собственным весом для ширины спины.', 'active'),
  (null, 'system', 'vertikalnaya_tyaga_k_grudi', 'Вертикальная тяга к груди', 'Спина', array['Руки']::text[], array['широчайшие', 'большая круглая']::text[], array['бицепс', 'ромбовидные', 'нижняя трапеция']::text[], array[]::text[], 'Блок', 'Тяга вертикальная', 'rpe', 'Блочная вертикальная тяга для широчайших.', 'active'),
  (null, 'system', 'vertikalnaya_tyaga_obratnym_hvatom', 'Вертикальная тяга обратным хватом', 'Спина', array['Руки']::text[], array['широчайшие']::text[], array['бицепс', 'большая круглая']::text[], array[]::text[], 'Блок', 'Тяга вертикальная', 'rpe', 'Вертикальная тяга с большим участием бицепса.', 'active'),
  (null, 'system', 'gorizontalnaya_tyaga_bloka', 'Горизонтальная тяга блока', 'Спина', array['Руки']::text[], array['широчайшие', 'ромбовидные']::text[], array['бицепс', 'средняя трапеция', 'задняя дельта']::text[], array[]::text[], 'Блок', 'Тяга горизонтальная', 'rpe', 'Горизонтальная тяга для толщины спины.', 'active'),
  (null, 'system', 'tyaga_shtangi_v_naklone', 'Тяга штанги в наклоне', 'Спина', array['Руки', 'Кор']::text[], array['широчайшие', 'ромбовидные']::text[], array['бицепс', 'разгибатели спины', 'задняя дельта']::text[], array[]::text[], 'Штанга', 'Тяга горизонтальная', 'rpe', 'Свободновесовая тяга для спины и корпуса.', 'active'),
  (null, 'system', 'tyaga_ganteli_odnoy_rukoy', 'Тяга гантели одной рукой', 'Спина', array['Руки']::text[], array['широчайшие', 'ромбовидные']::text[], array['бицепс', 'задняя дельта']::text[], array[]::text[], 'Гантели', 'Тяга горизонтальная', 'rpe', 'Односторонняя тяга для контроля лопатки и спины.', 'active'),
  (null, 'system', 'tyaga_t_grifa', 'Тяга Т-грифа', 'Спина', array['Руки']::text[], array['широчайшие', 'ромбовидные']::text[], array['бицепс', 'средняя трапеция', 'задняя дельта']::text[], array[]::text[], 'Тренажёр', 'Тяга горизонтальная', 'rpe', 'Тяга для толщины спины с устойчивой траекторией.', 'active'),
  (null, 'system', 'pulover_v_bloke', 'Пуловер в блоке', 'Спина', array['Грудь']::text[], array['широчайшие']::text[], array['большая круглая', 'длинная головка трицепса']::text[], array[]::text[], 'Блок', 'Изоляция', 'rir', 'Изолированная тяга прямыми руками для широчайших.', 'active'),
  (null, 'system', 'shragi_so_shtangoy', 'Шраги со штангой', 'Спина', array['Плечи']::text[], array['верхняя трапеция']::text[], array['предплечья']::text[], array[]::text[], 'Штанга', 'Изоляция', 'rir', 'Подъём плеч для трапеций.', 'active'),
  (null, 'system', 'obratnaya_giperekstenziya', 'Обратная гиперэкстензия', 'Спина', array['Ноги', 'Кор']::text[], array['разгибатели спины', 'ягодичные']::text[], array['бицепс бедра', 'мышцы кора']::text[], array[]::text[], 'Тренажёр', 'Тазовый шарнир', 'rpe', 'Разгибание таза/спины с акцентом на заднюю цепь.', 'active'),
  (null, 'system', 'zhim_shtangi_stoya', 'Жим штанги стоя', 'Плечи', array['Руки', 'Кор']::text[], array['передняя дельта', 'средняя дельта']::text[], array['трицепс', 'верх грудных', 'мышцы кора']::text[], array[]::text[], 'Штанга', 'Жим вертикальный', 'rpe', 'Базовый вертикальный жим для плеч и корпуса.', 'active'),
  (null, 'system', 'zhim_ganteley_sidya', 'Жим гантелей сидя', 'Плечи', array['Руки']::text[], array['передняя дельта', 'средняя дельта']::text[], array['трицепс', 'стабилизаторы плеча']::text[], array[]::text[], 'Гантели', 'Жим вертикальный', 'rpe', 'Вертикальный жим гантелей для плеч.', 'active'),
  (null, 'system', 'zhim_v_trenazhere_na_plechi', 'Жим в тренажёре на плечи', 'Плечи', array['Руки']::text[], array['передняя дельта', 'средняя дельта']::text[], array['трицепс']::text[], array[]::text[], 'Тренажёр', 'Жим вертикальный', 'rpe', 'Стабильный вертикальный жим в тренажёре.', 'active'),
  (null, 'system', 'mahi_gantelyami_v_storony', 'Махи гантелями в стороны', 'Плечи', array[]::text[], array['средняя дельта']::text[], array['надостная мышца']::text[], array[]::text[], 'Гантели', 'Изоляция', 'rir', 'Изолированная работа на среднюю дельту.', 'active'),
  (null, 'system', 'mahi_v_storony_v_krossovere', 'Махи в стороны в кроссовере', 'Плечи', array[]::text[], array['средняя дельта']::text[], array['надостная мышца']::text[], array[]::text[], 'Блок', 'Изоляция', 'rir', 'Блочный вариант для средней дельты с постоянным напряжением.', 'active'),
  (null, 'system', 'mahi_gantelyami_v_naklone', 'Махи гантелями в наклоне', 'Плечи', array['Спина']::text[], array['задняя дельта']::text[], array['ромбовидные', 'средняя трапеция']::text[], array[]::text[], 'Гантели', 'Изоляция', 'rir', 'Изолированная работа на заднюю дельту.', 'active'),
  (null, 'system', 'face_pull', 'Face pull', 'Плечи', array['Спина']::text[], array['задняя дельта', 'наружные ротаторы плеча']::text[], array['средняя трапеция', 'ромбовидные']::text[], array[]::text[], 'Блок', 'Тяга горизонтальная', 'rir', 'Тяговое упражнение для задней дельты и здоровья плеч.', 'active'),
  (null, 'system', 'obratnaya_babochka', 'Обратная бабочка', 'Плечи', array['Спина']::text[], array['задняя дельта']::text[], array['ромбовидные', 'средняя трапеция']::text[], array[]::text[], 'Тренажёр', 'Изоляция', 'rir', 'Тренажёрное движение для задней дельты.', 'active'),
  (null, 'system', 'podem_ganteley_pered_soboy', 'Подъём гантелей перед собой', 'Плечи', array[]::text[], array['передняя дельта']::text[], array['верх грудных']::text[], array[]::text[], 'Гантели', 'Изоляция', 'rir', 'Изолированная работа на переднюю дельту.', 'active'),
  (null, 'system', 'sgibanie_ruk_so_shtangoy', 'Сгибание рук со штангой', 'Руки', array[]::text[], array['бицепс']::text[], array['плечевая', 'плечелучевая']::text[], array[]::text[], 'Штанга', 'Сгибание', 'rir', 'Базовое сгибание рук для бицепса.', 'active'),
  (null, 'system', 'sgibanie_ruk_s_gantelyami', 'Сгибание рук с гантелями', 'Руки', array[]::text[], array['бицепс']::text[], array['плечевая', 'плечелучевая']::text[], array[]::text[], 'Гантели', 'Сгибание', 'rir', 'Сгибание рук с независимой работой сторон.', 'active'),
  (null, 'system', 'molotkovye_sgibaniya', 'Молотковые сгибания', 'Руки', array['Предплечья']::text[], array['плечевая', 'плечелучевая']::text[], array['бицепс']::text[], array[]::text[], 'Гантели', 'Сгибание', 'rir', 'Сгибание нейтральным хватом для брахиалиса и предплечий.', 'active'),
  (null, 'system', 'sgibanie_ruk_na_skame_skotta', 'Сгибание рук на скамье Скотта', 'Руки', array[]::text[], array['бицепс']::text[], array['плечевая']::text[], array[]::text[], 'Тренажёр', 'Сгибание', 'rir', 'Изолированное сгибание с фиксацией плеча.', 'active'),
  (null, 'system', 'razgibanie_ruk_na_bloke', 'Разгибание рук на блоке', 'Руки', array[]::text[], array['трицепс']::text[], array[]::text[], array[]::text[], 'Блок', 'Разгибание', 'rir', 'Блочное разгибание рук для трицепса.', 'active'),
  (null, 'system', 'frantsuzskiy_zhim_lezha', 'Французский жим лёжа', 'Руки', array[]::text[], array['трицепс']::text[], array['стабилизаторы плеча']::text[], array[]::text[], 'Штанга', 'Разгибание', 'rir', 'Свободновесовое разгибание для трицепса.', 'active'),
  (null, 'system', 'razgibanie_ganteli_iz_za_golovy', 'Разгибание гантели из-за головы', 'Руки', array['Плечи']::text[], array['длинная головка трицепса']::text[], array['мышцы кора']::text[], array[]::text[], 'Гантели', 'Разгибание', 'rir', 'Упражнение на длинную головку трицепса.', 'active'),
  (null, 'system', 'otzhimaniya_na_brusyah_s_tritsepsovym_aktsentom', 'Отжимания на брусьях с трицепсовым акцентом', 'Руки', array['Грудь', 'Плечи']::text[], array['трицепс']::text[], array['грудные', 'передняя дельта']::text[], array[]::text[], 'Вес тела', 'Жим горизонтальный', 'rpe', 'Брусья с акцентом на разгибание локтя.', 'active'),
  (null, 'system', 'sgibanie_kistey_so_shtangoy', 'Сгибание кистей со штангой', 'Руки', array[]::text[], array['сгибатели предплечья']::text[], array[]::text[], array[]::text[], 'Штанга', 'Сгибание', 'rir', 'Изолированная работа на сгибатели предплечья.', 'active'),
  (null, 'system', 'planka', 'Планка', 'Кор', array[]::text[], array['поперечная мышца живота', 'прямая мышца живота']::text[], array['ягодичные', 'плечевой пояс']::text[], array[]::text[], 'Вес тела', 'Стабилизация', 'none', 'Статическая стабилизация корпуса.', 'active'),
  (null, 'system', 'bokovaya_planka', 'Боковая планка', 'Кор', array[]::text[], array['косые мышцы живота']::text[], array['средняя ягодичная', 'плечевой пояс']::text[], array[]::text[], 'Вес тела', 'Стабилизация', 'none', 'Антибоковая стабилизация корпуса.', 'active'),
  (null, 'system', 'skruchivaniya', 'Скручивания', 'Кор', array[]::text[], array['прямая мышца живота']::text[], array['косые мышцы живота']::text[], array[]::text[], 'Вес тела', 'Сгибание', 'rir', 'Базовое сгибание корпуса для пресса.', 'active'),
  (null, 'system', 'podem_nog_v_vise', 'Подъём ног в висе', 'Кор', array['Руки']::text[], array['прямая мышца живота', 'подвздошно-поясничная']::text[], array['сгибатели бедра', 'мышцы хвата']::text[], array[]::text[], 'Вес тела', 'Сгибание', 'rir', 'Подъём ног с акцентом на нижний пресс и сгибатели бедра.', 'active'),
  (null, 'system', 'dead_bug', 'Dead bug', 'Кор', array[]::text[], array['поперечная мышца живота']::text[], array['сгибатели бедра', 'мышцы стабилизации таза']::text[], array[]::text[], 'Вес тела', 'Стабилизация', 'none', 'Контроль корпуса и таза в положении лёжа.', 'active'),
  (null, 'system', 'pallof_press', 'Pallof press', 'Кор', array[]::text[], array['косые мышцы живота', 'поперечная мышца живота']::text[], array['ягодичные', 'мышцы плечевого пояса']::text[], array[]::text[], 'Блок', 'Антиротация', 'rir', 'Антиротационное упражнение для корпуса.', 'active'),
  (null, 'system', 'russkie_skruchivaniya', 'Русские скручивания', 'Кор', array[]::text[], array['косые мышцы живота']::text[], array['прямая мышца живота', 'сгибатели бедра']::text[], array[]::text[], 'Медбол', 'Антиротация', 'rir', 'Динамическая ротационная работа корпуса.', 'active'),
  (null, 'system', 'ab_wheel_rollout', 'Ab wheel rollout', 'Кор', array['Плечи']::text[], array['прямая мышца живота', 'поперечная мышца живота']::text[], array['широчайшие', 'плечевой пояс']::text[], array[]::text[], 'Другое', 'Стабилизация', 'rpe', 'Антиразгибание корпуса с роликом.', 'active'),
  (null, 'system', 'hodba_na_dorozhke_v_naklone', 'Ходьба на дорожке в наклоне', 'Кардио', array['Ноги']::text[], array['сердечно-сосудистая система']::text[], array['ягодичные', 'икроножные']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Низкоударная кардио-нагрузка с наклоном.', 'active'),
  (null, 'system', 'begovaya_dorozhka', 'Беговая дорожка', 'Кардио', array['Ноги']::text[], array['сердечно-сосудистая система']::text[], array['квадрицепсы', 'ягодичные', 'икроножные']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Беговая или интервальная работа на дорожке.', 'active'),
  (null, 'system', 'ellipticheskiy_trenazher', 'Эллиптический тренажёр', 'Кардио', array['Ноги', 'Руки']::text[], array['сердечно-сосудистая система']::text[], array['ягодичные', 'квадрицепсы', 'плечевой пояс']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Кардио с низкой ударной нагрузкой.', 'active'),
  (null, 'system', 'velotrenazher', 'Велотренажёр', 'Кардио', array['Ноги']::text[], array['сердечно-сосудистая система']::text[], array['квадрицепсы', 'ягодичные']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Кардио с акцентом на ноги.', 'active'),
  (null, 'system', 'grebnoy_trenazher', 'Гребной тренажёр', 'Кардио', array['Спина', 'Ноги', 'Руки']::text[], array['сердечно-сосудистая система']::text[], array['широчайшие', 'ноги', 'бицепс', 'кор']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Кардио с участием всего тела.', 'active'),
  (null, 'system', 'stepper_lestnitsa', 'Степпер / лестница', 'Кардио', array['Ноги']::text[], array['сердечно-сосудистая система']::text[], array['ягодичные', 'квадрицепсы', 'икроножные']::text[], array[]::text[], 'Кардио-тренажёр', 'Кардио', 'none', 'Кардио-нагрузка с акцентом на ноги и ягодичные.', 'active'),
  (null, 'system', 'skakalka', 'Скакалка', 'Кардио', array['Ноги', 'Кор']::text[], array['сердечно-сосудистая система']::text[], array['икроножные', 'плечевой пояс', 'кор']::text[], array[]::text[], 'Другое', 'Кардио', 'none', 'Координационная и кардио-нагрузка.', 'active'),
  (null, 'system', '90_90_dlya_tazobedrennyh', '90/90 для тазобедренных', 'Мобилити', array['Ноги']::text[], array['наружная и внутренняя ротация бедра']::text[], array['ягодичные', 'приводящие']::text[], array[]::text[], 'Коврик', 'Мобилити', 'none', 'Мобилизация тазобедренных суставов.', 'active'),
  (null, 'system', 'mobilizatsiya_golenostopa_u_steny', 'Мобилизация голеностопа у стены', 'Мобилити', array['Ноги']::text[], array['голеностопный сустав']::text[], array['икроножные', 'камбаловидные']::text[], array[]::text[], 'Вес тела', 'Мобилити', 'none', 'Работа над дорсифлексией голеностопа.', 'active'),
  (null, 'system', 'rastyazhka_privodyaschih_v_glubokom_prisede', 'Растяжка приводящих в глубоком приседе', 'Мобилити', array['Ноги']::text[], array['приводящие']::text[], array['тазобедренные', 'мышцы кора']::text[], array[]::text[], 'Вес тела', 'Мобилити', 'none', 'Мобилити для доседа и раскрытия таза.', 'active'),
  (null, 'system', 'rastyazhka_sgibateley_bedra', 'Растяжка сгибателей бедра', 'Мобилити', array['Ноги', 'Кор']::text[], array['подвздошно-поясничная', 'прямая мышца бедра']::text[], array['ягодичные']::text[], array[]::text[], 'Вес тела', 'Мобилити', 'none', 'Растяжка передней линии бедра и таза.', 'active'),
  (null, 'system', 'razgibanie_grudnogo_otdela_na_rolle', 'Разгибание грудного отдела на ролле', 'Мобилити', array['Спина']::text[], array['грудной отдел позвоночника']::text[], array['широчайшие', 'межрёберные']::text[], array[]::text[], 'Другое', 'Мобилити', 'none', 'Мобилизация грудного отдела.', 'active'),
  (null, 'system', 'plechevye_prohodki_s_palkoy_rezinoy', 'Плечевые проходки с палкой/резиной', 'Мобилити', array['Плечи']::text[], array['плечевой сустав']::text[], array['грудные', 'широчайшие']::text[], array[]::text[], 'Резина', 'Мобилити', 'none', 'Динамическая мобилизация плечевого пояса.', 'active'),
  (null, 'system', 'koshka_korova', 'Кошка-корова', 'Мобилити', array['Спина', 'Кор']::text[], array['позвоночник']::text[], array['мышцы кора']::text[], array[]::text[], 'Коврик', 'Мобилити', 'none', 'Мягкая мобилизация позвоночника.', 'active'),
  (null, 'system', 'berpi', 'Берпи', 'ОФП / Плиометрика', array['Кардио', 'Ноги', 'Грудь', 'Кор']::text[], array['сердечно-сосудистая система']::text[], array['грудные', 'квадрицепсы', 'кор', 'плечи']::text[], array[]::text[], 'Вес тела', 'ОФП', 'none', 'Комплексное кондиционное упражнение.', 'active'),
  (null, 'system', 'pryzhki_na_tumbu', 'Прыжки на тумбу', 'ОФП / Плиометрика', array['Ноги']::text[], array['квадрицепсы', 'ягодичные']::text[], array['икроножные', 'кор']::text[], array[]::text[], 'Другое', 'Плиометрика', 'none', 'Плиометрическая работа на мощность ног.', 'active'),
  (null, 'system', 'medbol_slem', 'Медбол слэм', 'ОФП / Плиометрика', array['Кор', 'Плечи']::text[], array['широчайшие', 'пресс']::text[], array['плечи', 'руки', 'ноги']::text[], array[]::text[], 'Медбол', 'ОФП', 'none', 'Взрывное движение с медболом для мощности и кондиции.', 'active'),
  (null, 'system', 'fermerskaya_progulka', 'Фермерская прогулка', 'ОФП / Плиометрика', array['Кор', 'Руки', 'Спина']::text[], array['мышцы хвата', 'трапеции', 'кор']::text[], array['ягодичные', 'квадрицепсы']::text[], array[]::text[], 'Гантели', 'Переноска', 'rpe', 'Переноска веса для хвата, корпуса и общей силы.', 'active'),
  (null, 'system', 'tolkanie_saney', 'Толкание саней', 'ОФП / Плиометрика', array['Ноги', 'Кардио']::text[], array['квадрицепсы', 'ягодичные']::text[], array['икроножные', 'кор', 'плечевой пояс']::text[], array[]::text[], 'Сани', 'ОФП', 'rpe', 'Силово-кондиционная работа с санями.', 'active'),
  (null, 'system', 'battle_ropes', 'Battle ropes', 'ОФП / Плиометрика', array['Плечи', 'Кор', 'Кардио']::text[], array['плечевой пояс', 'сердечно-сосудистая система']::text[], array['кор', 'руки']::text[], array[]::text[], 'Канаты', 'ОФП', 'none', 'Интервальная работа канатами для плеч и кондиции.', 'active'),
  (null, 'system', 'mahi_girey', 'Махи гирей', 'ОФП / Плиометрика', array['Ноги', 'Спина', 'Кор']::text[], array['ягодичные', 'бицепс бедра']::text[], array['разгибатели спины', 'широчайшие', 'кор']::text[], array[]::text[], 'Гиря', 'Тазовый шарнир', 'rpe', 'Взрывной тазовый шарнир с гирей.', 'active'),
  (null, 'system', 'medvezhya_prohodka', 'Медвежья проходка', 'ОФП / Плиометрика', array['Кор', 'Плечи', 'Ноги']::text[], array['кор', 'плечевой пояс']::text[], array['квадрицепсы', 'ягодичные', 'руки']::text[], array[]::text[], 'Вес тела', 'ОФП', 'none', 'Ползание для корпуса, координации и плечевого пояса.', 'active')
on conflict (exercise_key) where source_type = 'system' and exercise_key is not null do update set
  name = excluded.name,
  primary_category = excluded.primary_category,
  secondary_categories = excluded.secondary_categories,
  agonists = excluded.agonists,
  synergists = excluded.synergists,
  antagonists = excluded.antagonists,
  equipment = excluded.equipment,
  movement_pattern = excluded.movement_pattern,
  default_intensity_type = excluded.default_intensity_type,
  short_description = excluded.short_description,
  status = excluded.status,
  updated_at = now();

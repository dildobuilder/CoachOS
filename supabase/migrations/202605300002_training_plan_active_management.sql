alter table public.training_plans
drop constraint if exists training_plans_status_check;

alter table public.training_plans
add constraint training_plans_status_check
check (status in ('active', 'inactive', 'completed', 'archived'));

with ranked as (
  select
    id,
    row_number() over (
      partition by client_id
      order by starts_on desc, created_at desc, id desc
    ) as rank
  from public.training_plans
  where status = 'active'
)
update public.training_plans
set status = 'inactive'
where id in (
  select id
  from ranked
  where rank > 1
);

create unique index if not exists training_plans_one_active_per_client_idx
on public.training_plans(client_id)
where status = 'active';

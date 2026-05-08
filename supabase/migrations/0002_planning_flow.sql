alter table public.time_slots
  add column if not exists shift text not null default 'manha' check (shift in ('manha', 'tarde')),
  add column if not exists slot_type text not null default 'aula' check (slot_type in ('aula', 'intervalo'));

alter table public.time_slots
  drop constraint if exists time_slots_organization_id_day_of_week_period_index_key;

create unique index if not exists time_slots_org_shift_day_period_idx
  on public.time_slots(organization_id, shift, day_of_week, period_index);

create table if not exists public.teacher_subject_loads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  weekly_hours integer not null check (weekly_hours between 1 and 40),
  created_at timestamptz not null default now(),
  unique (organization_id, teacher_id, subject_id)
);

create table if not exists public.class_subject_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  weekly_hours integer not null check (weekly_hours between 1 and 40),
  created_at timestamptz not null default now(),
  unique (organization_id, class_id, subject_id)
);

create index if not exists teacher_subject_loads_org_teacher_idx
  on public.teacher_subject_loads(organization_id, teacher_id);

create index if not exists class_subject_requirements_org_class_idx
  on public.class_subject_requirements(organization_id, class_id);

alter table public.teacher_subject_loads enable row level security;
alter table public.class_subject_requirements enable row level security;

create policy "teacher_subject_loads_org_access" on public.teacher_subject_loads
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "class_subject_requirements_org_access" on public.class_subject_requirements
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

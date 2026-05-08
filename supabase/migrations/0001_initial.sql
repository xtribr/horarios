create extension if not exists "pgcrypto";

create schema if not exists private;

create type public.membership_role as enum ('owner', 'admin', 'scheduler', 'viewer', 'super_admin');
create type public.room_type as enum ('sala', 'laboratorio', 'quadra', 'outro');
create type public.grouping_rule as enum ('geminadas', 'separadas', 'livre');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'timeout');
create type public.schedule_status as enum ('draft', 'confirmed', 'archived');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'scheduler',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  email text,
  max_classes_per_day integer not null default 6 check (max_classes_per_day between 1 and 20),
  created_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  color text not null default '#2563eb',
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1),
  grade text not null default '',
  periods_per_day integer not null default 5 check (periods_per_day between 1 and 12),
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1),
  type public.room_type not null default 'sala',
  created_at timestamptz not null default now()
);

create table public.time_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 6),
  period_index integer not null check (period_index between 1 and 12),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  unique (organization_id, day_of_week, period_index),
  check (start_time < end_time)
);

create table public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  time_slot_id uuid not null references public.time_slots(id) on delete cascade,
  available boolean not null default true,
  unique (teacher_id, time_slot_id)
);

create table public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete cascade,
  weekly_hours integer not null check (weekly_hours between 1 and 40),
  room_id_preferred uuid references public.rooms(id) on delete set null,
  grouping_rule public.grouping_rule not null default 'livre',
  created_at timestamptz not null default now()
);

create table public.schedule_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status public.job_status not null default 'queued',
  input_snapshot jsonb not null,
  result jsonb,
  solver_version text,
  started_at timestamptz,
  finished_at timestamptz,
  timeout_seconds integer not null default 120 check (timeout_seconds between 1 and 900),
  hard_conflicts integer,
  soft_score integer,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.schedule_generation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.schedule_generation_jobs(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  stage text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.schedule_generation_jobs(id) on delete set null,
  name text not null,
  status public.schedule_status not null default 'draft',
  hard_conflicts integer not null default 0,
  soft_score integer,
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  assignment_id uuid not null references public.teaching_assignments(id) on delete restrict,
  time_slot_id uuid not null references public.time_slots(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (schedule_id, assignment_id, time_slot_id)
);

create table public.schedule_entry_audit (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  schedule_entry_id uuid references public.schedule_entries(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

create index memberships_user_org_idx on public.memberships(user_id, organization_id);
create index teachers_org_idx on public.teachers(organization_id);
create index subjects_org_idx on public.subjects(organization_id);
create index classes_org_idx on public.classes(organization_id);
create index rooms_org_idx on public.rooms(organization_id);
create index time_slots_org_day_period_idx on public.time_slots(organization_id, day_of_week, period_index);
create index teacher_availability_org_teacher_idx on public.teacher_availability(organization_id, teacher_id);
create index teaching_assignments_org_class_teacher_idx on public.teaching_assignments(organization_id, class_id, teacher_id);
create index schedule_jobs_org_status_idx on public.schedule_generation_jobs(organization_id, status);
create index schedule_events_job_idx on public.schedule_generation_events(job_id, created_at);
create index schedule_entries_schedule_slot_idx on public.schedule_entries(schedule_id, time_slot_id);

create or replace function private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.role = 'super_admin'
  );
$$;

create or replace function public.create_organization_for_current_user(org_name text, profile_name text default '')
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'usuario_nao_autenticado';
  end if;

  insert into public.organizations(name) values (org_name) returning id into new_org_id;
  insert into public.profiles(user_id, name) values (auth.uid(), coalesce(profile_name, ''))
    on conflict (user_id) do update set name = excluded.name;
  insert into public.memberships(organization_id, user_id, role)
    values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.rooms enable row level security;
alter table public.time_slots enable row level security;
alter table public.teacher_availability enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.schedule_generation_jobs enable row level security;
alter table public.schedule_generation_events enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.schedule_entry_audit enable row level security;

create policy "profiles_self" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "memberships_visible_to_members" on public.memberships
  for select to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin());

create policy "memberships_insert_self_owner" on public.memberships
  for insert to authenticated
  with check ((select auth.uid()) = user_id or private.is_super_admin());

create policy "organizations_member_access" on public.organizations
  for all to authenticated
  using (private.is_org_member(id) or private.is_super_admin())
  with check (private.is_org_member(id) or private.is_super_admin());

create policy "teachers_org_access" on public.teachers
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "subjects_org_access" on public.subjects
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "classes_org_access" on public.classes
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "rooms_org_access" on public.rooms
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "time_slots_org_access" on public.time_slots
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "teacher_availability_org_access" on public.teacher_availability
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "teaching_assignments_org_access" on public.teaching_assignments
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "jobs_org_access" on public.schedule_generation_jobs
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "job_events_org_access" on public.schedule_generation_events
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "schedules_org_access" on public.schedules
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "schedule_entries_org_access" on public.schedule_entries
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

create policy "schedule_entry_audit_org_access" on public.schedule_entry_audit
  for all to authenticated
  using (private.is_org_member(organization_id) or private.is_super_admin())
  with check (private.is_org_member(organization_id) or private.is_super_admin());

-- Dados ficticios para demonstracao. Nao representam escola, professores ou alunos reais.
insert into public.organizations(id, name)
values ('00000000-0000-4000-8000-000000000001', 'Escola Demonstracao Ficticia')
on conflict (id) do nothing;

insert into public.subjects(id, organization_id, name, color) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Matematica', '#2563eb'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Lingua Portuguesa', '#16a34a'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Ciencias', '#dc2626')
on conflict (id) do nothing;

insert into public.teachers(id, organization_id, name, email, max_classes_per_day) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Professor Demo 1', 'demo1@example.invalid', 5),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Professor Demo 2', 'demo2@example.invalid', 5),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Professor Demo 3', 'demo3@example.invalid', 5)
on conflict (id) do nothing;

insert into public.classes(id, organization_id, name, grade, periods_per_day) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', '6A Demo', '6 ano', 5),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', '7A Demo', '7 ano', 5)
on conflict (id) do nothing;

insert into public.rooms(id, organization_id, name, type) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', 'Sala Demo 1', 'sala'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', 'Sala Demo 2', 'sala')
on conflict (id) do nothing;

insert into public.time_slots(id, organization_id, day_of_week, period_index, start_time, end_time)
select
  ('00000000-0000-4000-8000-' || lpad((500 + day * 10 + period)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  day,
  period,
  (time '07:00' + ((period - 1) * interval '50 minutes'))::time,
  (time '07:00' + (period * interval '50 minutes'))::time
from generate_series(1, 5) as day
cross join generate_series(1, 5) as period
on conflict (organization_id, day_of_week, period_index) do nothing;

insert into public.teacher_availability(organization_id, teacher_id, time_slot_id, available)
select
  t.organization_id,
  t.id,
  s.id,
  true
from public.teachers t
join public.time_slots s on s.organization_id = t.organization_id
where t.organization_id = '00000000-0000-4000-8000-000000000001'
on conflict (teacher_id, time_slot_id) do nothing;

insert into public.teaching_assignments(id, organization_id, teacher_id, subject_id, class_id, weekly_hours, room_id_preferred, grouping_rule) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000301', 4, '00000000-0000-4000-8000-000000000401', 'livre'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000301', 4, '00000000-0000-4000-8000-000000000401', 'separadas'),
  ('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000302', 3, '00000000-0000-4000-8000-000000000402', 'geminadas')
on conflict (id) do nothing;

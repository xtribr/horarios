begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users(id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'usuario-a@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'usuario-b@example.invalid')
on conflict (id) do nothing;

insert into public.organizations(id, name)
values
  ('20000000-0000-4000-8000-000000000001', 'Org A Teste'),
  ('20000000-0000-4000-8000-000000000002', 'Org B Teste')
on conflict (id) do nothing;

insert into public.memberships(organization_id, user_id, role)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'owner')
on conflict (organization_id, user_id) do nothing;

insert into public.teachers(id, organization_id, name)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Docente Org A'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'Docente Org B')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.teachers), 1, 'usuario A ve apenas docentes da org A');
select is((select name from public.teachers), 'Docente Org A', 'usuario A nao ve dados da org B');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.teachers), 1, 'usuario B ve apenas docentes da org B');
select is((select name from public.teachers), 'Docente Org B', 'usuario B nao ve dados da org A');

select * from finish();
rollback;

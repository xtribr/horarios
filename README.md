# Montar Horario

MVP SaaS para gerar grade de horario escolar com Next.js, Supabase/Postgres com RLS multi-tenant e solver Python com OR-Tools CP-SAT.

## Dados

O seed local contem apenas dados ficticios de demonstracao. Nao use dados reais de escolas, professores ou alunos sem fonte e autorizacao explicita.

## Setup local

```bash
npm install
python3 -m pip install -r requirements.txt
supabase start
supabase status -o env
```

Crie `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY do supabase status -o env>
```

As portas Supabase foram deslocadas para `5532x` para evitar conflito com outros projetos locais.

## Comandos

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run test:e2e
npm run test:db
npm run solver:test
```

## Arquitetura

- `app/`: rotas Next.js App Router.
- `supabase/migrations/0001_initial.sql`: schema, indices, enums, funcoes privadas e RLS.
- `solver/montar_horario_solver/`: solver CP-SAT oficial do MVP.
- `lib/solver/adapter.ts`: adaptador Node para chamar o solver Python.
- `components/schedule-grid/`: grade editavel com validacao local de conflitos hard.

## Criterio de seguranca

Toda tabela de dominio tem `organization_id` e RLS. Server Actions sempre resolvem a organizacao pelo usuario autenticado; `organization_id` enviado pelo cliente nao e fonte de verdade.

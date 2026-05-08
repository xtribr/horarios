import { PlanningNav } from "@/components/planning-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createClassSubjectRequirementAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { ClassSubjectRequirement } from "@/lib/types";

export default async function CurriculumPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const [classes, subjects, requirements] = await Promise.all([
    supabase.from("classes").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("subjects").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("class_subject_requirements").select("*").eq("organization_id", organization.id),
  ]);
  const classById = new Map((classes.data ?? []).map((item) => [item.id, item.name]));
  const subjectById = new Map((subjects.data ?? []).map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <PlanningNav />
      <div>
        <h1 className="text-2xl font-semibold">Matriz curricular da turma</h1>
        <p className="mt-1 text-sm text-slate-500">Cadastre o que os alunos estudam por semana: exemplo MAT 5, PORT 4, Ingles 1, Artes 1.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Turma x disciplina</CardTitle></CardHeader>
        <CardContent>
          <form action={createClassSubjectRequirementAction} className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <Select name="class_id" required>{(classes.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subject_id" required>{(subjects.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Input name="weekly_hours" type="number" min={1} max={40} defaultValue={1} />
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(requirements.data ?? []) as ClassSubjectRequirement[]}
        columns={[
          { key: "class_id", label: "Turma", render: (row) => classById.get(row.class_id) },
          { key: "subject_id", label: "Disciplina", render: (row) => subjectById.get(row.subject_id) },
          { key: "weekly_hours", label: "Aulas/semana" },
        ]}
      />
    </div>
  );
}

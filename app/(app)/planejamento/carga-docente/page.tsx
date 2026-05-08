import { PlanningNav } from "@/components/planning-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createTeacherSubjectLoadAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { TeacherSubjectLoad } from "@/lib/types";

export default async function TeacherLoadPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const [teachers, subjects, loads] = await Promise.all([
    supabase.from("teachers").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("subjects").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("teacher_subject_loads").select("*").eq("organization_id", organization.id),
  ]);
  const teacherById = new Map((teachers.data ?? []).map((item) => [item.id, item.name]));
  const subjectById = new Map((subjects.data ?? []).map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <PlanningNav />
      <div>
        <h1 className="text-2xl font-semibold">Carga docente</h1>
        <p className="mt-1 text-sm text-slate-500">Informe quais disciplinas cada professor pode assumir e quantas aulas semanais cobre.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Professor x disciplina</CardTitle></CardHeader>
        <CardContent>
          <form action={createTeacherSubjectLoadAction} className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <Select name="teacher_id" required>{(teachers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subject_id" required>{(subjects.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Input name="weekly_hours" type="number" min={1} max={40} defaultValue={1} />
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(loads.data ?? []) as TeacherSubjectLoad[]}
        columns={[
          { key: "teacher_id", label: "Professor", render: (row) => teacherById.get(row.teacher_id) },
          { key: "subject_id", label: "Disciplina", render: (row) => subjectById.get(row.subject_id) },
          { key: "weekly_hours", label: "Aulas/semana" },
        ]}
      />
    </div>
  );
}

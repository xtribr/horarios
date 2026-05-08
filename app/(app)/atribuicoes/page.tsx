import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createAssignmentAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { TeachingAssignment } from "@/lib/types";

export default async function AssignmentsPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const [teachers, subjects, classes, rooms, assignments] = await Promise.all([
    supabase.from("teachers").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("subjects").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("classes").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("rooms").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("teaching_assignments").select("*").eq("organization_id", organization.id),
  ]);
  const teacherById = new Map((teachers.data ?? []).map((item) => [item.id, item.name]));
  const subjectById = new Map((subjects.data ?? []).map((item) => [item.id, item.name]));
  const classById = new Map((classes.data ?? []).map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Atribuicoes</h1>
        <p className="mt-1 text-sm text-slate-500">Defina professor, disciplina, turma e carga semanal.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Nova atribuicao</CardTitle></CardHeader>
        <CardContent>
          <form action={createAssignmentAction} className="grid gap-3 lg:grid-cols-7">
            <Select name="teacher_id" required>{(teachers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="subject_id" required>{(subjects.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="class_id" required>{(classes.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Input name="weekly_hours" type="number" min={1} max={40} defaultValue={2} />
            <Select name="room_id_preferred"><option value="">Sala livre</option>{(rooms.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
            <Select name="grouping_rule" defaultValue="livre"><option value="livre">Livre</option><option value="geminadas">Geminadas</option><option value="separadas">Separadas</option></Select>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(assignments.data ?? []) as TeachingAssignment[]}
        columns={[
          { key: "teacher_id", label: "Professor", render: (row) => teacherById.get(row.teacher_id) },
          { key: "subject_id", label: "Disciplina", render: (row) => subjectById.get(row.subject_id) },
          { key: "class_id", label: "Turma", render: (row) => classById.get(row.class_id) },
          { key: "weekly_hours", label: "Aulas/semana" },
          { key: "grouping_rule", label: "Regra" },
        ]}
      />
    </div>
  );
}

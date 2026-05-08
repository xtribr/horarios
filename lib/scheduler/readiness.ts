import type { SolverInput } from "@/lib/types";

export function validateSnapshotReadiness(snapshot: SolverInput) {
  const problems: string[] = [];

  if (snapshot.teachers.length === 0) problems.push("Cadastre pelo menos um professor.");
  if (snapshot.classes.length === 0) problems.push("Cadastre pelo menos uma turma.");
  if (snapshot.subjects.length === 0) problems.push("Cadastre pelo menos uma disciplina.");
  if (snapshot.rooms.length === 0) problems.push("Cadastre pelo menos uma sala.");
  if (snapshot.timeSlots.length === 0) problems.push("Cadastre os periodos da semana.");
  if (snapshot.assignments.length === 0) problems.push("Cadastre as atribuicoes de aula.");

  const slotsByClass = new Map(snapshot.classes.map((klass) => [klass.id, 0]));
  for (const assignment of snapshot.assignments) {
    slotsByClass.set(assignment.class_id, (slotsByClass.get(assignment.class_id) ?? 0) + assignment.weekly_hours);
  }

  for (const klass of snapshot.classes) {
    const capacity = snapshot.timeSlots.filter((slot) => slot.organization_id === klass.organization_id).length;
    const demand = slotsByClass.get(klass.id) ?? 0;
    if (demand > capacity) {
      problems.push(`A turma ${klass.name} tem ${demand} aulas para ${capacity} periodos disponiveis.`);
    }
  }

  for (const teacher of snapshot.teachers) {
    const demand = snapshot.assignments
      .filter((assignment) => assignment.teacher_id === teacher.id)
      .reduce((sum, assignment) => sum + assignment.weekly_hours, 0);
    const availability = snapshot.availability.filter((item) => item.teacher_id === teacher.id && item.available).length;
    if (demand > availability) {
      problems.push(`${teacher.name} tem ${demand} aulas para ${availability} periodos disponiveis.`);
    }
  }

  return problems;
}

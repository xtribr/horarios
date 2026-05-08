import type {
  ClassSubjectRequirement,
  SchoolClass,
  Subject,
  Teacher,
  TeacherAvailability,
  TeacherSubjectLoad,
  TeachingAssignment,
  TimeSlot,
} from "@/lib/types";

export type PlanningConflict = {
  type:
    | "missing_curriculum"
    | "teacher_load_shortage"
    | "class_over_capacity"
    | "teacher_availability_shortage"
    | "assignment_mismatch";
  severity: "error" | "warning";
  message: string;
};

export function analyzePlanningConflicts(input: {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  timeSlots: TimeSlot[];
  requirements: ClassSubjectRequirement[];
  teacherLoads: TeacherSubjectLoad[];
  assignments: TeachingAssignment[];
  availability: TeacherAvailability[];
}) {
  const conflicts: PlanningConflict[] = [];
  const subjectById = new Map(input.subjects.map((subject) => [subject.id, subject]));
  const classById = new Map(input.classes.map((klass) => [klass.id, klass]));
  const teacherById = new Map(input.teachers.map((teacher) => [teacher.id, teacher]));
  const teachingSlots = input.timeSlots.filter((slot) => (slot.slot_type ?? "aula") === "aula");

  for (const klass of input.classes) {
    const requirements = input.requirements.filter((item) => item.class_id === klass.id);
    const requiredHours = requirements.reduce((sum, item) => sum + item.weekly_hours, 0);
    if (requirements.length === 0) {
      conflicts.push({
        type: "missing_curriculum",
        severity: "error",
        message: `A turma ${klass.name} ainda nao tem matriz curricular cadastrada.`,
      });
    }
    if (requiredHours > teachingSlots.length) {
      conflicts.push({
        type: "class_over_capacity",
        severity: "error",
        message: `A turma ${klass.name} precisa de ${requiredHours} aulas, mas existem ${teachingSlots.length} periodos de aula.`,
      });
    }
  }

  for (const requirement of input.requirements) {
    const availableTeacherHours = input.teacherLoads
      .filter((load) => load.subject_id === requirement.subject_id)
      .reduce((sum, load) => sum + load.weekly_hours, 0);
    const requiredSubjectHours = input.requirements
      .filter((item) => item.subject_id === requirement.subject_id)
      .reduce((sum, item) => sum + item.weekly_hours, 0);

    if (availableTeacherHours < requiredSubjectHours) {
      conflicts.push({
        type: "teacher_load_shortage",
        severity: "error",
        message: `${subjectById.get(requirement.subject_id)?.name ?? "Disciplina"} demanda ${requiredSubjectHours} aulas nas turmas, mas professores cadastrados cobrem ${availableTeacherHours}.`,
      });
    }
  }

  for (const assignment of input.assignments) {
    const teacherAvailableSlots = input.availability
      .filter((item) => item.teacher_id === assignment.teacher_id && item.available)
      .length;
    const teacherDemand = input.assignments
      .filter((item) => item.teacher_id === assignment.teacher_id)
      .reduce((sum, item) => sum + item.weekly_hours, 0);

    if (teacherDemand > teacherAvailableSlots) {
      conflicts.push({
        type: "teacher_availability_shortage",
        severity: "error",
        message: `${teacherById.get(assignment.teacher_id)?.name ?? "Professor"} tem ${teacherDemand} aulas atribuidas, mas apenas ${teacherAvailableSlots} periodos disponiveis.`,
      });
    }

    const matchingRequirement = input.requirements.find(
      (item) => item.class_id === assignment.class_id && item.subject_id === assignment.subject_id,
    );
    if (matchingRequirement && matchingRequirement.weekly_hours !== assignment.weekly_hours) {
      conflicts.push({
        type: "assignment_mismatch",
        severity: "warning",
        message: `${classById.get(assignment.class_id)?.name ?? "Turma"} em ${subjectById.get(assignment.subject_id)?.name ?? "disciplina"} pede ${matchingRequirement.weekly_hours} aulas, mas a atribuicao tem ${assignment.weekly_hours}.`,
      });
    }
  }

  return dedupeConflicts(conflicts);
}

function dedupeConflicts(conflicts: PlanningConflict[]) {
  const seen = new Set<string>();
  return conflicts.filter((conflict) => {
    const key = `${conflict.type}:${conflict.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

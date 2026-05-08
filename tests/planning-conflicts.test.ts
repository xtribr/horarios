import { describe, expect, it } from "vitest";
import { analyzePlanningConflicts } from "@/lib/scheduler/planning-conflicts";
import type { ClassSubjectRequirement, TeacherSubjectLoad } from "@/lib/types";

describe("analyzePlanningConflicts", () => {
  it("aponta disciplina da turma sem carga docente suficiente", () => {
    const conflicts = analyzePlanningConflicts({
      classes: [{ id: "c1", organization_id: "org", name: "6A", grade: "6", periods_per_day: 5 }],
      subjects: [{ id: "mat", organization_id: "org", name: "MAT", color: "#2563eb" }],
      teachers: [{ id: "t1", organization_id: "org", name: "Ana", email: null, max_classes_per_day: 5 }],
      timeSlots: [
        { id: "s1", organization_id: "org", day_of_week: 1, period_index: 1, start_time: "07:00", end_time: "07:50", shift: "manha", slot_type: "aula" },
      ],
      requirements: [
        { id: "r1", organization_id: "org", class_id: "c1", subject_id: "mat", weekly_hours: 5 },
      ] as ClassSubjectRequirement[],
      teacherLoads: [
        { id: "l1", organization_id: "org", teacher_id: "t1", subject_id: "mat", weekly_hours: 3 },
      ] as TeacherSubjectLoad[],
      assignments: [],
      availability: [],
    });

    expect(conflicts.some((conflict) => conflict.type === "teacher_load_shortage")).toBe(true);
  });
});

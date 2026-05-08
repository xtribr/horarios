import { describe, expect, it } from "vitest";
import { PythonOrToolsSolverAdapter } from "@/lib/solver/adapter";
import type { SolverInput } from "@/lib/types";

function solverInput(): SolverInput {
  return {
    organizationId: "org-demo",
    teachers: [
      { id: "teacher-1", organization_id: "org-demo", name: "Professor Demo", email: null, max_classes_per_day: 5 },
    ],
    subjects: [
      { id: "subject-1", organization_id: "org-demo", name: "Matematica", color: "#2563eb" },
    ],
    classes: [
      { id: "class-1", organization_id: "org-demo", name: "6A", grade: "6 ano", periods_per_day: 2 },
    ],
    rooms: [
      { id: "room-1", organization_id: "org-demo", name: "Sala 1", type: "sala" },
    ],
    timeSlots: [
      { id: "slot-1", organization_id: "org-demo", day_of_week: 1, period_index: 1, start_time: "07:00", end_time: "07:50" },
      { id: "slot-2", organization_id: "org-demo", day_of_week: 1, period_index: 2, start_time: "07:50", end_time: "08:40" },
    ],
    availability: [
      { id: "av-1", organization_id: "org-demo", teacher_id: "teacher-1", time_slot_id: "slot-1", available: true },
      { id: "av-2", organization_id: "org-demo", teacher_id: "teacher-1", time_slot_id: "slot-2", available: true },
    ],
    assignments: [
      {
        id: "assignment-1",
        organization_id: "org-demo",
        teacher_id: "teacher-1",
        subject_id: "subject-1",
        class_id: "class-1",
        weekly_hours: 1,
        room_id_preferred: "room-1",
        grouping_rule: "livre",
      },
    ],
    options: { timeoutSeconds: 5 },
  };
}

describe("PythonOrToolsSolverAdapter", () => {
  it("executa o solver Python como pacote importavel", async () => {
    const result = await new PythonOrToolsSolverAdapter().solve(solverInput());

    expect(result.status).toBe("SOLVED");
    expect(result.scheduleEntries).toHaveLength(1);
    expect(result.diagnostics.solverVersion).not.toBe("unknown");
  });
});

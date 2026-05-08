import { describe, expect, it } from "vitest";
import { validateHardConflicts } from "@/lib/scheduler/conflicts";
import type { SolverInput } from "@/lib/types";

const input: SolverInput = {
  organizationId: "org",
  teachers: [{ id: "t1", organization_id: "org", name: "Professor", email: null, max_classes_per_day: 5 }],
  subjects: [{ id: "s1", organization_id: "org", name: "Matematica", color: "#2563eb" }],
  classes: [
    { id: "c1", organization_id: "org", name: "6A", grade: "6", periods_per_day: 5 },
    { id: "c2", organization_id: "org", name: "7A", grade: "7", periods_per_day: 5 },
  ],
  rooms: [{ id: "r1", organization_id: "org", name: "Sala 1", type: "sala" }],
  timeSlots: [{ id: "slot1", organization_id: "org", day_of_week: 1, period_index: 1, start_time: "07:00", end_time: "07:50" }],
  availability: [{ id: "a1", organization_id: "org", teacher_id: "t1", time_slot_id: "slot1", available: true }],
  assignments: [
    { id: "as1", organization_id: "org", teacher_id: "t1", subject_id: "s1", class_id: "c1", weekly_hours: 1, room_id_preferred: null, grouping_rule: "livre" },
    { id: "as2", organization_id: "org", teacher_id: "t1", subject_id: "s1", class_id: "c2", weekly_hours: 1, room_id_preferred: null, grouping_rule: "livre" },
  ],
  options: { timeoutSeconds: 120 },
};

describe("validateHardConflicts", () => {
  it("detecta professor duplicado no mesmo periodo", () => {
    const conflicts = validateHardConflicts(input, [
      { assignmentId: "as1", timeSlotId: "slot1", roomId: "r1" },
      { assignmentId: "as2", timeSlotId: "slot1", roomId: "r1" },
    ]);

    expect(conflicts.some((conflict) => conflict.type === "teacher")).toBe(true);
  });
});

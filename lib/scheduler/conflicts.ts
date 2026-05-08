import type { ScheduleEntry, SolverInput } from "@/lib/types";

export type ScheduleConflict = {
  type: "teacher" | "class" | "room" | "availability";
  message: string;
  entry: ScheduleEntry;
};

export function validateHardConflicts(input: SolverInput, entries: ScheduleEntry[]) {
  const conflicts: ScheduleConflict[] = [];
  const assignments = new Map(input.assignments.map((assignment) => [assignment.id, assignment]));
  const teachers = new Map(input.teachers.map((teacher) => [teacher.id, teacher]));
  const classes = new Map(input.classes.map((klass) => [klass.id, klass]));
  const rooms = new Map(input.rooms.map((room) => [room.id, room]));
  const availability = new Set(
    input.availability
      .filter((item) => item.available)
      .map((item) => `${item.teacher_id}:${item.time_slot_id}`),
  );

  const teacherSlot = new Map<string, ScheduleEntry>();
  const classSlot = new Map<string, ScheduleEntry>();
  const roomSlot = new Map<string, ScheduleEntry>();

  for (const entry of entries) {
    const assignment = assignments.get(entry.assignmentId);
    if (!assignment) continue;

    const teacherKey = `${assignment.teacher_id}:${entry.timeSlotId}`;
    const classKey = `${assignment.class_id}:${entry.timeSlotId}`;
    const roomKey = `${entry.roomId}:${entry.timeSlotId}`;

    if (teacherSlot.has(teacherKey)) {
      conflicts.push({
        type: "teacher",
        entry,
        message: `${teachers.get(assignment.teacher_id)?.name ?? "Professor"} esta em duas aulas no mesmo periodo.`,
      });
    }
    if (classSlot.has(classKey)) {
      conflicts.push({
        type: "class",
        entry,
        message: `${classes.get(assignment.class_id)?.name ?? "Turma"} tem duas aulas no mesmo periodo.`,
      });
    }
    if (roomSlot.has(roomKey)) {
      conflicts.push({
        type: "room",
        entry,
        message: `${rooms.get(entry.roomId)?.name ?? "Sala"} esta duplicada no mesmo periodo.`,
      });
    }
    if (!availability.has(teacherKey)) {
      conflicts.push({
        type: "availability",
        entry,
        message: `${teachers.get(assignment.teacher_id)?.name ?? "Professor"} nao esta disponivel neste periodo.`,
      });
    }

    teacherSlot.set(teacherKey, entry);
    classSlot.set(classKey, entry);
    roomSlot.set(roomKey, entry);
  }

  return conflicts;
}

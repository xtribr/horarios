export type GroupingRule = "geminadas" | "separadas" | "livre";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "timeout";

export type Organization = {
  id: string;
  name: string;
};

export type Teacher = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  max_classes_per_day: number;
};

export type Subject = {
  id: string;
  organization_id: string;
  name: string;
  color: string;
};

export type SchoolClass = {
  id: string;
  organization_id: string;
  name: string;
  grade: string;
  periods_per_day: number;
};

export type Room = {
  id: string;
  organization_id: string;
  name: string;
  type: "sala" | "laboratorio" | "quadra" | "outro";
};

export type TimeSlot = {
  id: string;
  organization_id: string;
  day_of_week: number;
  period_index: number;
  start_time: string;
  end_time: string;
  shift?: "manha" | "tarde";
  slot_type?: "aula" | "intervalo";
};

export type TeacherAvailability = {
  id: string;
  organization_id: string;
  teacher_id: string;
  time_slot_id: string;
  available: boolean;
};

export type TeachingAssignment = {
  id: string;
  organization_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  weekly_hours: number;
  room_id_preferred: string | null;
  grouping_rule: GroupingRule;
};

export type TeacherSubjectLoad = {
  id: string;
  organization_id: string;
  teacher_id: string;
  subject_id: string;
  weekly_hours: number;
};

export type ClassSubjectRequirement = {
  id: string;
  organization_id: string;
  class_id: string;
  subject_id: string;
  weekly_hours: number;
};

export type ScheduleEntry = {
  assignmentId: string;
  timeSlotId: string;
  roomId: string;
};

export type SolverInput = {
  organizationId: string;
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  rooms: Room[];
  timeSlots: TimeSlot[];
  availability: TeacherAvailability[];
  assignments: TeachingAssignment[];
  options: {
    timeoutSeconds: number;
  };
};

export type SolverResult = {
  status: "SOLVED" | "UNSAT" | "TIMEOUT" | "CANCELLED" | "ERROR";
  scheduleEntries: ScheduleEntry[];
  hardConflicts: number;
  softScore: number | null;
  elapsedMs: number;
  diagnostics: {
    solver: "ortools-cp-sat";
    solverVersion: string;
    exploredBranches?: number;
    conflicts?: number;
    message?: string;
  };
};

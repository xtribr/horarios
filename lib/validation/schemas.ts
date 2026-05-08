import { z } from "zod";

const uuid = z.string().uuid();

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do professor."),
  email: z.string().trim().email("E-mail invalido.").optional().or(z.literal("")),
  max_classes_per_day: z.coerce.number().int().min(1).max(20),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da disciplina."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal."),
});

export const classSchema = z.object({
  name: z.string().trim().min(1, "Informe a turma."),
  grade: z.string().trim().default(""),
  periods_per_day: z.coerce.number().int().min(1).max(12),
});

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Informe a sala."),
  type: z.enum(["sala", "laboratorio", "quadra", "outro"]),
});

export const timeSlotSchema = z.object({
  day_of_week: z.coerce.number().int().min(1).max(6),
  period_index: z.coerce.number().int().min(1).max(12),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  shift: z.enum(["manha", "tarde"]).default("manha"),
  slot_type: z.enum(["aula", "intervalo"]).default("aula"),
});

export const assignmentSchema = z.object({
  teacher_id: uuid,
  subject_id: uuid,
  class_id: uuid,
  weekly_hours: z.coerce.number().int().min(1).max(40),
  room_id_preferred: uuid.optional().or(z.literal("")),
  grouping_rule: z.enum(["geminadas", "separadas", "livre"]),
});

export const createJobSchema = z.object({
  timeout_seconds: z.coerce.number().int().min(1).max(900).default(120),
});

export const teacherSubjectLoadSchema = z.object({
  teacher_id: uuid,
  subject_id: uuid,
  weekly_hours: z.coerce.number().int().min(1).max(40),
});

export const classSubjectRequirementSchema = z.object({
  class_id: uuid,
  subject_id: uuid,
  weekly_hours: z.coerce.number().int().min(1).max(40),
});

export type TeacherInput = z.infer<typeof teacherSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type TeacherSubjectLoadInput = z.infer<typeof teacherSubjectLoadSchema>;
export type ClassSubjectRequirementInput = z.infer<typeof classSubjectRequirementSchema>;

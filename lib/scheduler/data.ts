import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SolverInput } from "@/lib/types";
export { validateSnapshotReadiness } from "@/lib/scheduler/readiness";

export async function buildSolverSnapshot(organizationId: string, timeoutSeconds = 120): Promise<SolverInput> {
  const supabase = await createSupabaseServerClient();

  const [
    teachers,
    subjects,
    classes,
    rooms,
    timeSlots,
    availability,
    assignments,
  ] = await Promise.all([
    supabase.from("teachers").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("subjects").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("classes").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("rooms").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("time_slots").select("*").eq("organization_id", organizationId).order("day_of_week").order("period_index"),
    supabase.from("teacher_availability").select("*").eq("organization_id", organizationId),
    supabase.from("teaching_assignments").select("*").eq("organization_id", organizationId),
  ]);

  const errors = [teachers, subjects, classes, rooms, timeSlots, availability, assignments]
    .map((result) => result.error)
    .filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Falha ao carregar snapshot do solver.");
  }

  return {
    organizationId,
    teachers: teachers.data ?? [],
    subjects: subjects.data ?? [],
    classes: classes.data ?? [],
    rooms: rooms.data ?? [],
    timeSlots: (timeSlots.data ?? []).filter((slot) => (slot.slot_type ?? "aula") === "aula"),
    availability: availability.data ?? [],
    assignments: assignments.data ?? [],
    options: {
      timeoutSeconds,
    },
  };
}

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClassSubjectRequirement, TeacherSubjectLoad } from "@/lib/types";

export async function loadPlanningData(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const [teacherLoads, requirements] = await Promise.all([
    supabase.from("teacher_subject_loads").select("*").eq("organization_id", organizationId),
    supabase.from("class_subject_requirements").select("*").eq("organization_id", organizationId),
  ]);

  if (teacherLoads.error) throw new Error(teacherLoads.error.message);
  if (requirements.error) throw new Error(requirements.error.message);

  return {
    teacherLoads: (teacherLoads.data ?? []) as TeacherSubjectLoad[],
    requirements: (requirements.data ?? []) as ClassSubjectRequirement[],
  };
}

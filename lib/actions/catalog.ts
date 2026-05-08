"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization, requireUser } from "@/lib/tenant/current";
import {
  assignmentSchema,
  classSubjectRequirementSchema,
  classSchema,
  roomSchema,
  subjectSchema,
  teacherSubjectLoadSchema,
  teacherSchema,
  timeSlotSchema,
} from "@/lib/validation/schemas";

function formToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function signInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const organizationName = String(formData.get("organization_name") ?? "");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.rpc("create_organization_for_current_user", {
      org_name: organizationName,
      profile_name: name,
    });
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTeacherAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = teacherSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("teachers").insert({
    ...parsed,
    email: parsed.email || null,
    organization_id: organization.id,
  });
  revalidatePath("/cadastros/professores");
}

export async function createSubjectAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = subjectSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("subjects").insert({ ...parsed, organization_id: organization.id });
  revalidatePath("/cadastros/disciplinas");
}

export async function createClassAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = classSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("classes").insert({ ...parsed, organization_id: organization.id });
  revalidatePath("/cadastros/turmas");
}

export async function createRoomAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = roomSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("rooms").insert({ ...parsed, organization_id: organization.id });
  revalidatePath("/cadastros/salas");
}

export async function createTimeSlotAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = timeSlotSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("time_slots").insert({ ...parsed, organization_id: organization.id });
  revalidatePath("/cadastros/periodos");
}

export async function createAssignmentAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = assignmentSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("teaching_assignments").insert({
    ...parsed,
    room_id_preferred: parsed.room_id_preferred || null,
    organization_id: organization.id,
  });
  revalidatePath("/atribuicoes");
}

export async function createTeacherSubjectLoadAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = teacherSubjectLoadSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("teacher_subject_loads").upsert({
    ...parsed,
    organization_id: organization.id,
  }, { onConflict: "organization_id,teacher_id,subject_id" });
  revalidatePath("/planejamento/carga-docente");
  revalidatePath("/gerar");
}

export async function createClassSubjectRequirementAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const parsed = classSubjectRequirementSchema.parse(formToObject(formData));
  const supabase = await createSupabaseServerClient();
  await supabase.from("class_subject_requirements").upsert({
    ...parsed,
    organization_id: organization.id,
  }, { onConflict: "organization_id,class_id,subject_id" });
  revalidatePath("/planejamento/matriz-curricular");
  revalidatePath("/gerar");
}

export async function upsertAvailabilityAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const teacherId = String(formData.get("teacher_id") ?? "");
  const availableSlots = new Set(formData.getAll("available_slots").map(String));

  const { data: slots, error } = await supabase
    .from("time_slots")
    .select("id")
    .eq("organization_id", organization.id);

  if (error) throw new Error(error.message);

  const rows = (slots ?? []).map((slot) => ({
    organization_id: organization.id,
    teacher_id: teacherId,
    time_slot_id: slot.id,
    available: availableSlots.has(slot.id),
  }));

  await supabase
    .from("teacher_availability")
    .upsert(rows, { onConflict: "teacher_id,time_slot_id" });

  revalidatePath("/disponibilidade");
}

export async function deleteRowAction(table: string, id: string, path: string) {
  const allowed = new Set(["teachers", "subjects", "classes", "rooms", "time_slots", "teaching_assignments", "teacher_subject_loads", "class_subject_requirements"]);
  if (!allowed.has(table)) throw new Error("Tabela nao permitida.");

  const supabase = await createSupabaseServerClient();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath(path);
}

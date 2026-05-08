"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PythonOrToolsSolverAdapter } from "@/lib/solver/adapter";
import { requireCurrentOrganization, requireUser } from "@/lib/tenant/current";
import { buildSolverSnapshot, validateSnapshotReadiness } from "@/lib/scheduler/data";
import { validateHardConflicts } from "@/lib/scheduler/conflicts";
import { createJobSchema } from "@/lib/validation/schemas";

export async function createGenerationJobAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const user = await requireUser();
  const parsed = createJobSchema.parse(Object.fromEntries(formData.entries()));
  const snapshot = await buildSolverSnapshot(organization.id, parsed.timeout_seconds);
  const readiness = validateSnapshotReadiness(snapshot);

  if (readiness.length > 0) {
    redirect(`/gerar?error=${encodeURIComponent(readiness.join(" "))}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: job, error } = await supabase
    .from("schedule_generation_jobs")
    .insert({
      organization_id: organization.id,
      requested_by: user.id,
      status: "running",
      input_snapshot: snapshot,
      timeout_seconds: parsed.timeout_seconds,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("schedule_generation_events").insert({
    organization_id: organization.id,
    job_id: job.id,
    progress: 15,
    stage: "snapshot",
    message: "Snapshot validado. Solver CP-SAT iniciado.",
  });

  const adapter = new PythonOrToolsSolverAdapter();
  const result = await adapter.solve(snapshot);
  const conflicts = validateHardConflicts(snapshot, result.scheduleEntries);
  const status = result.status === "SOLVED"
    ? "succeeded"
    : result.status === "TIMEOUT"
      ? "timeout"
      : "failed";

  await supabase.from("schedule_generation_jobs").update({
    status,
    result,
    solver_version: result.diagnostics.solverVersion,
    finished_at: new Date().toISOString(),
    hard_conflicts: conflicts.length,
    soft_score: result.softScore,
    error_message: result.status === "SOLVED" ? null : result.diagnostics.message,
  }).eq("id", job.id);

  await supabase.from("schedule_generation_events").insert({
    organization_id: organization.id,
    job_id: job.id,
    progress: 100,
    stage: status,
    message: result.diagnostics.message ?? "Execucao finalizada.",
  });

  revalidatePath("/gerar");
  redirect(`/gerar?job=${job.id}`);
}

export async function confirmScheduleAction(formData: FormData) {
  const organization = await requireCurrentOrganization();
  const jobId = String(formData.get("job_id") ?? "");
  const name = String(formData.get("name") ?? "Horario gerado");
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("schedule_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("organization_id", organization.id)
    .single();

  if (error || !job) throw new Error(error?.message ?? "Job nao encontrado.");

  const result = job.result as {
    scheduleEntries?: Array<{ assignmentId: string; timeSlotId: string; roomId: string }>;
  } | null;

  if (!result?.scheduleEntries?.length) {
    throw new Error("Job sem horario viavel para confirmar.");
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .insert({
      organization_id: organization.id,
      job_id: jobId,
      name,
      status: "confirmed",
      hard_conflicts: job.hard_conflicts ?? 0,
      soft_score: job.soft_score,
      generated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scheduleError) throw new Error(scheduleError.message);

  await supabase.from("schedule_entries").insert(
    result.scheduleEntries.map((entry) => ({
      organization_id: organization.id,
      schedule_id: schedule.id,
      assignment_id: entry.assignmentId,
      time_slot_id: entry.timeSlotId,
      room_id: entry.roomId,
    })),
  );

  redirect(`/horario/${schedule.id}`);
}

import Link from "next/link";
import { ScheduleGrid } from "@/components/schedule-grid/grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { SolverInput } from "@/lib/types";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data: schedule } = await supabase
    .from("schedules")
    .select("*, schedule_generation_jobs(input_snapshot)")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .single();
  const { data: entries } = await supabase
    .from("schedule_entries")
    .select("*")
    .eq("schedule_id", id)
    .eq("organization_id", organization.id);

  if (!schedule) {
    return <p className="text-sm text-slate-500">Horario nao encontrado.</p>;
  }

  const snapshot = (schedule.schedule_generation_jobs as { input_snapshot?: SolverInput } | null)?.input_snapshot;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{schedule.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Conflitos hard: {schedule.hard_conflicts} · score: {schedule.soft_score ?? "-"}</p>
        </div>
        <Link href={`/api/schedules/${id}/export?format=excel`}>
          <Button variant="secondary">Exportar Excel</Button>
        </Link>
      </div>
      {snapshot ? (
        <ScheduleGrid
          input={snapshot}
          initialEntries={(entries ?? []).map((entry) => ({
            id: entry.id,
            assignmentId: entry.assignment_id,
            timeSlotId: entry.time_slot_id,
            roomId: entry.room_id,
          }))}
        />
      ) : (
        <Card>
          <CardHeader><CardTitle>Snapshot ausente</CardTitle></CardHeader>
          <CardContent>Este horario nao tem snapshot de solver associado.</CardContent>
        </Card>
      )}
    </div>
  );
}

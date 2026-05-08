import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createGenerationJobAction, confirmScheduleAction } from "@/lib/actions/jobs";
import { buildSolverSnapshot, validateSnapshotReadiness } from "@/lib/scheduler/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import { formatarStatusJob } from "@/lib/utils";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; job?: string }>;
}) {
  const params = await searchParams;
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const snapshot = await buildSolverSnapshot(organization.id);
  const readiness = validateSnapshotReadiness(snapshot);
  const { data: jobs } = await supabase
    .from("schedule_generation_jobs")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const selectedJob = jobs?.find((job) => job.id === params.job) ?? jobs?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gerar horario</h1>
        <p className="mt-1 text-sm text-slate-500">Fonte dos dados: cadastros da organizacao atual no Supabase.</p>
      </div>
      {params.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</div> : null}
      <Card>
        <CardHeader><CardTitle>Pre-checagem</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Professores" value={snapshot.teachers.length} />
            <Metric label="Turmas" value={snapshot.classes.length} />
            <Metric label="Salas" value={snapshot.rooms.length} />
            <Metric label="Atribuicoes" value={snapshot.assignments.length} />
          </div>
          {readiness.length > 0 ? (
            <ul className="list-disc rounded-md border border-amber-200 bg-amber-50 p-4 pl-8 text-sm text-amber-800">
              {readiness.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          ) : (
            <form action={createGenerationJobAction} className="flex flex-wrap items-end gap-3">
              <label className="block text-sm font-medium">
                Timeout segundos
                <Input name="timeout_seconds" type="number" min={1} max={900} defaultValue={120} className="mt-1 w-40" />
              </label>
              <Button type="submit">Gerar horario</Button>
            </form>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ultimas geracoes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(jobs ?? []).length === 0 ? <p className="text-sm text-slate-500">Nenhum job executado.</p> : null}
          {(jobs ?? []).map((job) => (
            <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">{formatarStatusJob(job.status)}</p>
                <p className="text-slate-500">Score {job.soft_score ?? "-"} · conflitos hard {job.hard_conflicts ?? "-"}</p>
              </div>
              {job.status === "succeeded" ? (
                <form action={confirmScheduleAction} className="flex gap-2">
                  <input type="hidden" name="job_id" value={job.id} />
                  <Input name="name" defaultValue="Horario confirmado" className="w-48" />
                  <Button type="submit" variant="secondary">Confirmar</Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
      {selectedJob?.result ? (
        <Card>
          <CardHeader><CardTitle>Resultado bruto do solver</CardTitle></CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(selectedJob.result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

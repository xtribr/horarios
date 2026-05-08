import Link from "next/link";
import { PlanningNav } from "@/components/planning-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createGenerationJobAction, confirmScheduleAction } from "@/lib/actions/jobs";
import { buildSolverSnapshot, validateSnapshotReadiness } from "@/lib/scheduler/data";
import { loadPlanningData } from "@/lib/scheduler/planning-data";
import { analyzePlanningConflicts } from "@/lib/scheduler/planning-conflicts";
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
  const planning = await loadPlanningData(organization.id);
  const readiness = validateSnapshotReadiness(snapshot);
  const planningConflicts = analyzePlanningConflicts({
    ...snapshot,
    requirements: planning.requirements,
    teacherLoads: planning.teacherLoads,
  });
  const blockingConflicts = planningConflicts.filter((conflict) => conflict.severity === "error");
  const { data: jobs } = await supabase
    .from("schedule_generation_jobs")
    .select("*")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const selectedJob = jobs?.find((job) => job.id === params.job) ?? jobs?.[0];

  return (
    <div className="space-y-6">
      <PlanningNav />
      <div>
        <h1 className="text-2xl font-semibold">Gerar horario</h1>
        <p className="mt-1 text-sm text-slate-500">Fluxo do coordenador: configure periodos, carga docente, matriz curricular, disponibilidade e confira conflitos antes do solver.</p>
      </div>
      {params.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.error}</div> : null}
      <Card>
        <CardHeader><CardTitle>Checklist de criacao do horario</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-5">
            <ChecklistCard href="/cadastros/periodos" title="1. Periodos e intervalos" value={snapshot.timeSlots.length} ok={snapshot.timeSlots.length > 0} />
            <ChecklistCard href="/planejamento/carga-docente" title="2. Carga docente" value={planning.teacherLoads.length} ok={planning.teacherLoads.length > 0} />
            <ChecklistCard href="/planejamento/matriz-curricular" title="3. Matriz curricular" value={planning.requirements.length} ok={planning.requirements.length > 0} />
            <ChecklistCard href="/disponibilidade" title="4. Disponibilidade" value={snapshot.availability.filter((item) => item.available).length} ok={snapshot.availability.some((item) => item.available)} />
            <ChecklistCard href="/atribuicoes" title="5. Atribuicoes" value={snapshot.assignments.length} ok={snapshot.assignments.length > 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Gestao de conflitos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Professores" value={snapshot.teachers.length} />
            <Metric label="Turmas" value={snapshot.classes.length} />
            <Metric label="Aulas da matriz" value={planning.requirements.reduce((sum, item) => sum + item.weekly_hours, 0)} />
            <Metric label="Conflitos" value={planningConflicts.length + readiness.length} />
          </div>
          {readiness.length > 0 ? (
            <ul className="list-disc rounded-md border border-amber-200 bg-amber-50 p-4 pl-8 text-sm text-amber-800">
              {readiness.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          ) : null}
          {planningConflicts.length > 0 ? (
            <div className="space-y-2">
              {planningConflicts.map((conflict) => (
                <div
                  key={`${conflict.type}-${conflict.message}`}
                  className={conflict.severity === "error"
                    ? "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    : "rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"}
                >
                  <span className="font-semibold">{conflict.severity === "error" ? "Bloqueio" : "Aviso"}:</span> {conflict.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              Nenhum conflito estrutural encontrado. O solver pode tentar montar o horario.
            </div>
          )}
          {readiness.length === 0 && blockingConflicts.length === 0 ? (
            <form action={createGenerationJobAction} className="flex flex-wrap items-end gap-3">
              <label className="block text-sm font-medium">
                Timeout segundos
                <Input name="timeout_seconds" type="number" min={1} max={900} defaultValue={120} className="mt-1 w-40" />
              </label>
              <Button type="submit">Gerar horario</Button>
            </form>
          ) : null}
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

function ChecklistCard({ href, title, value, ok }: { href: string; title: string; value: number; ok: boolean }) {
  return (
    <Link href={href} className="rounded-md border bg-white p-4 transition hover:bg-slate-50">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className={ok ? "mt-1 text-xs text-emerald-600" : "mt-1 text-xs text-red-600"}>
        {ok ? "Configurado" : "Pendente"}
      </p>
    </Link>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { upsertAvailabilityAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import { diasDaSemana } from "@/lib/utils";

export default async function AvailabilityPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const [{ data: teachers }, { data: slots }, { data: availability }] = await Promise.all([
    supabase.from("teachers").select("*").eq("organization_id", organization.id).order("name"),
    supabase.from("time_slots").select("*").eq("organization_id", organization.id).order("day_of_week").order("period_index"),
    supabase.from("teacher_availability").select("*").eq("organization_id", organization.id),
  ]);
  const selectedTeacher = teachers?.[0];
  const availableSet = new Set(
    (availability ?? [])
      .filter((item) => item.teacher_id === selectedTeacher?.id && item.available)
      .map((item) => item.time_slot_id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Disponibilidade</h1>
        <p className="mt-1 text-sm text-slate-500">Marque os periodos em que o professor pode lecionar.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Matriz professor x periodo</CardTitle></CardHeader>
        <CardContent>
          {!selectedTeacher ? (
            <p className="text-sm text-slate-500">Cadastre professores antes de configurar disponibilidade.</p>
          ) : (
            <form action={upsertAvailabilityAction} className="space-y-4">
              <Select name="teacher_id" defaultValue={selectedTeacher.id}>
                {(teachers ?? []).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </Select>
              <div className="grid gap-2 md:grid-cols-5">
                {(slots ?? []).map((slot) => (
                  <label key={slot.id} className="flex items-center gap-2 rounded-md border bg-white p-3 text-sm">
                    <input
                      type="checkbox"
                      name="available_slots"
                      value={slot.id}
                      defaultChecked={availableSet.size === 0 || availableSet.has(slot.id)}
                    />
                    {diasDaSemana[slot.day_of_week - 1]} P{slot.period_index}
                  </label>
                ))}
              </div>
              <Button type="submit">Salvar disponibilidade</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

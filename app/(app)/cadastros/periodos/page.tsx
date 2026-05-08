import { CatalogNav } from "@/components/catalog-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createTimeSlotAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { TimeSlot } from "@/lib/types";

const dias = ["", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

export default async function TimeSlotsPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("time_slots").select("*").eq("organization_id", organization.id).order("day_of_week").order("period_index");

  return (
    <div className="space-y-6">
      <CatalogNav />
      <Card>
        <CardHeader><CardTitle>Periodos</CardTitle></CardHeader>
        <CardContent>
          <form action={createTimeSlotAction} className="grid gap-3 md:grid-cols-[160px_120px_140px_140px_auto]">
            <Select name="day_of_week" defaultValue="1">
              {dias.slice(1).map((dia, index) => <option key={dia} value={index + 1}>{dia}</option>)}
            </Select>
            <Input name="period_index" type="number" min={1} max={12} defaultValue={1} />
            <Input name="start_time" type="time" defaultValue="07:00" />
            <Input name="end_time" type="time" defaultValue="07:50" />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(data ?? []) as TimeSlot[]}
        columns={[
          { key: "day_of_week", label: "Dia", render: (row) => dias[row.day_of_week] },
          { key: "period_index", label: "Periodo" },
          { key: "start_time", label: "Inicio" },
          { key: "end_time", label: "Fim" },
        ]}
      />
    </div>
  );
}

import { CatalogNav } from "@/components/catalog-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClassAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { SchoolClass } from "@/lib/types";

export default async function ClassesPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("classes").select("*").eq("organization_id", organization.id).order("name");

  return (
    <div className="space-y-6">
      <CatalogNav />
      <Card>
        <CardHeader><CardTitle>Turmas</CardTitle></CardHeader>
        <CardContent>
          <form action={createClassAction} className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <Input name="name" placeholder="Turma" required />
            <Input name="grade" placeholder="Serie/ano" />
            <Input name="periods_per_day" type="number" min={1} max={12} defaultValue={5} />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(data ?? []) as SchoolClass[]}
        columns={[
          { key: "name", label: "Turma" },
          { key: "grade", label: "Serie" },
          { key: "periods_per_day", label: "Periodos/dia" },
        ]}
      />
    </div>
  );
}

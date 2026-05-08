import { CatalogNav } from "@/components/catalog-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTeacherAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { Teacher } from "@/lib/types";

export default async function TeachersPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("teachers").select("*").eq("organization_id", organization.id).order("name");

  return (
    <div className="space-y-6">
      <CatalogNav />
      <Card>
        <CardHeader><CardTitle>Professores</CardTitle></CardHeader>
        <CardContent>
          <form action={createTeacherAction} className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <Input name="name" placeholder="Nome" required />
            <Input name="email" type="email" placeholder="email opcional" />
            <Input name="max_classes_per_day" type="number" min={1} max={20} defaultValue={5} />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(data ?? []) as Teacher[]}
        columns={[
          { key: "name", label: "Nome" },
          { key: "email", label: "E-mail" },
          { key: "max_classes_per_day", label: "Max. aulas/dia" },
        ]}
      />
    </div>
  );
}

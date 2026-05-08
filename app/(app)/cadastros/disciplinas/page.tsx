import { CatalogNav } from "@/components/catalog-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSubjectAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { Subject } from "@/lib/types";

export default async function SubjectsPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("subjects").select("*").eq("organization_id", organization.id).order("name");

  return (
    <div className="space-y-6">
      <CatalogNav />
      <Card>
        <CardHeader><CardTitle>Disciplinas</CardTitle></CardHeader>
        <CardContent>
          <form action={createSubjectAction} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <Input name="name" placeholder="Nome" required />
            <Input name="color" type="color" defaultValue="#2563eb" />
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable
        rows={(data ?? []) as Subject[]}
        columns={[
          { key: "name", label: "Nome" },
          { key: "color", label: "Cor", render: (row) => <span className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded" style={{ background: row.color }} />{row.color}</span> },
        ]}
      />
    </div>
  );
}

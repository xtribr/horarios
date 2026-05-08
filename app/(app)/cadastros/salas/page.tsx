import { CatalogNav } from "@/components/catalog-nav";
import { SimpleTable } from "@/components/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { createRoomAction } from "@/lib/actions/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";
import type { Room } from "@/lib/types";

export default async function RoomsPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("rooms").select("*").eq("organization_id", organization.id).order("name");

  return (
    <div className="space-y-6">
      <CatalogNav />
      <Card>
        <CardHeader><CardTitle>Salas e ambientes</CardTitle></CardHeader>
        <CardContent>
          <form action={createRoomAction} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input name="name" placeholder="Sala" required />
            <Select name="type" defaultValue="sala">
              <option value="sala">Sala</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="quadra">Quadra</option>
              <option value="outro">Outro</option>
            </Select>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>
      <SimpleTable rows={(data ?? []) as Room[]} columns={[{ key: "name", label: "Nome" }, { key: "type", label: "Tipo" }]} />
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";

export default async function DashboardPage() {
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();

  const tables = [
    ["teachers", "Professores"],
    ["classes", "Turmas"],
    ["subjects", "Disciplinas"],
    ["rooms", "Salas"],
    ["teaching_assignments", "Atribuicoes"],
  ] as const;

  const counts = await Promise.all(
    tables.map(async ([table, label]) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);
      return { label, count: count ?? 0 };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visao operacional da base da escola. N amostral = registros cadastrados no tenant atual.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {counts.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Proximo passo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-slate-50" href="/cadastros/professores">Cadastrar professores</Link>
          <Link className="rounded-md border px-3 py-2 hover:bg-slate-50" href="/atribuicoes">Criar atribuicoes</Link>
          <Link className="rounded-md border px-3 py-2 hover:bg-slate-50" href="/gerar">Gerar horario</Link>
        </CardContent>
      </Card>
    </div>
  );
}

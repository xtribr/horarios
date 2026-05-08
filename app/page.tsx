import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Montar Horario
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            SaaS para gerar grade escolar com cadastro multi-tenant, RLS no Supabase
            e solver CP-SAT server-side. O MVP trabalha com dados cadastrados pela escola
            ou seed ficticio de demonstracao.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup">
              <Button>Criar conta</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
          </div>
        </div>
        <Card className="mt-12 max-w-4xl border-slate-800 bg-slate-900 text-white">
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            {["Cadastros", "Solver CP-SAT", "Grade editavel"].map((item) => (
              <div key={item} className="rounded-md border border-slate-800 p-4">
                <p className="font-semibold">{item}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Fluxo operacional do MVP, sem dados fantasmas.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

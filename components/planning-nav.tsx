import Link from "next/link";

const items = [
  ["/cadastros/periodos", "1. Periodos e intervalos"],
  ["/planejamento/carga-docente", "2. Carga docente"],
  ["/planejamento/matriz-curricular", "3. Matriz curricular"],
  ["/disponibilidade", "4. Disponibilidade"],
  ["/gerar", "5. Gerar horario"],
];

export function PlanningNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50">
          {label}
        </Link>
      ))}
    </div>
  );
}

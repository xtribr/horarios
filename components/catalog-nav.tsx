import Link from "next/link";

const items = [
  ["/cadastros/professores", "Professores"],
  ["/cadastros/disciplinas", "Disciplinas"],
  ["/cadastros/turmas", "Turmas"],
  ["/cadastros/salas", "Salas"],
  ["/cadastros/periodos", "Periodos"],
];

export function CatalogNav() {
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

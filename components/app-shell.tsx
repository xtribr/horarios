import Link from "next/link";
import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, School, Settings, Users } from "lucide-react";
import type { Organization } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cadastros/professores", label: "Cadastros", icon: Users },
  { href: "/planejamento/matriz-curricular", label: "Planejamento", icon: BookOpen },
  { href: "/disponibilidade", label: "Disponibilidade", icon: CalendarDays },
  { href: "/atribuicoes", label: "Atribuicoes", icon: ClipboardList },
  { href: "/gerar", label: "Gerar horario", icon: Settings },
];

export function AppShell({ organization, children }: { organization: Organization; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <School size={20} />
          </span>
          Montar Horario
        </Link>
        <p className="mt-2 text-sm text-slate-500">{organization.name}</p>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

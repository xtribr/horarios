import type React from "react";

export function SimpleTable<T extends { id: string }>({
  rows,
  columns,
}: {
  rows: T[];
  columns: Array<{ key: keyof T; label: string; render?: (row: T) => React.ReactNode }>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-medium">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                Nenhum registro cadastrado.
              </td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render ? column.render(row) : String(row[column.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

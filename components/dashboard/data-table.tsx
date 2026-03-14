import { StatusBadge } from "@/components/dashboard/status-badge";

type DataTableProps = {
  columns: string[];
  rows: Array<Record<string, string>>;
  statusKey?: string;
};

export function DataTable({ columns, rows, statusKey = "status" }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium text-slate-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[columns[0]] ?? index}`}>
              {columns.map((column) => {
                const value = row[column];
                const isStatus = column.toLowerCase() === statusKey.toLowerCase();

                return (
                  <td key={column} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-slate-200">
                    {isStatus ? <StatusBadge value={value} /> : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

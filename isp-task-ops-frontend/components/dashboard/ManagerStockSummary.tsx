"use client";

import { Card } from "@/components/ui/Card";

interface ManagerStockSummaryRow {
  materialId: string;
  material: string;
  usageToday: string;
}

interface ManagerStockSummaryProps {
  rows: ManagerStockSummaryRow[];
}

export function ManagerStockSummary({ rows }: ManagerStockSummaryProps) {
  return (
    <Card title="Material Usage Overview">
      <div className="overflow-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-3 py-2">Material</th>
              <th className="px-3 py-2">Usage Today</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.materialId} className="border-b border-gray-100">
                  <td className="px-3 py-3 font-semibold">{row.material}</td>
                  <td className="px-3 py-3">{row.usageToday}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-gray-500">
                  Belum ada penggunaan material hari ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

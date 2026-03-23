"use client";

import { useMemo, useState } from "react";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { Card } from "@/components/ui/Card";
import { SmartSearch } from "@/components/search/SmartSearch";
import { fuzzySearch } from "@/lib/search/fuzzySearch";
import { AttendanceFlag } from "@/components/attendance/AttendanceFlag";

export function AttendanceHistoryTable() {
  const history = useAttendanceStore((state) => state.history);
  const [query, setQuery] = useState("");

  const filteredHistory = useMemo(
    () => fuzzySearch(history, query, ["date", "checkInAt", "checkOutAt"]),
    [history, query]
  );

  return (
    <Card title="Riwayat Absensi" className="overflow-auto">
      <div className="space-y-3">
        <SmartSearch value={query} onChange={setQuery} placeholder="Cari data..." />

        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-2 py-2">Tanggal</th>
              <th className="px-2 py-2">Absen Masuk</th>
              <th className="px-2 py-2">Absen Pulang</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-2 py-2">{item.date}</td>
                  <td className="px-2 py-2">{item.checkInAt ?? "-"}</td>
                  <td className="px-2 py-2">{item.checkOutAt ?? "-"}</td>
                  <td className="px-2 py-2"><AttendanceFlag flagged={item.flagged} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-center text-gray-500" colSpan={4}>Data tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

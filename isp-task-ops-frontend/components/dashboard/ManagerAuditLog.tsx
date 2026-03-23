"use client";

import { useMemo, useState } from "react";
import { Check, FileSearch, MessageSquareMore } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { ManagementTable, type ManagementTableColumn } from "@/components/ui/ManagementTable";
import type { AuditLogItem } from "@/types/operations";

interface ManagerAuditLogProps {
  logs: AuditLogItem[];
  onInvestigate: (id: string) => void;
  onClarify: (id: string) => void;
  onReviewed: (id: string) => void;
}

export function ManagerAuditLog({ logs, onInvestigate, onClarify, onReviewed }: ManagerAuditLogProps) {
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("SEMUA");
  const [actionFilter, setActionFilter] = useState("SEMUA");
  const [dateFilter, setDateFilter] = useState("");

  const users = useMemo(() => ["SEMUA", ...Array.from(new Set(logs.map((item) => item.user)))], [logs]);
  const actions = useMemo(() => ["SEMUA", ...Array.from(new Set(logs.map((item) => item.actionType)))], [logs]);

  const filteredLogs = useMemo(
    () =>
      logs.filter((item) => {
        const matchesSearch = !search.trim() || [item.entityId, item.entityType, item.before, item.after].join(" ").toLowerCase().includes(search.toLowerCase());
        const matchesUser = userFilter === "SEMUA" || item.user === userFilter;
        const matchesAction = actionFilter === "SEMUA" || item.actionType === actionFilter;
        const matchesDate = !dateFilter || item.createdAt.slice(0, 10) === dateFilter;
        return matchesSearch && matchesUser && matchesAction && matchesDate;
      }),
    [actionFilter, dateFilter, logs, search, userFilter]
  );

  return (
    <Card title="Audit Log">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Cari ticket ID / entitas" />
        <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          {users.map((user) => <option key={user} value={user}>{user === "SEMUA" ? "Semua User" : user}</option>)}
        </select>
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          {actions.map((action) => <option key={action} value={action}>{action === "SEMUA" ? "Semua Aksi" : action}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
      </div>

      <ManagementTable
        data={filteredLogs}
        rowKey={(row) => row.id}
        emptyText="Tidak ada audit log yang sesuai filter."
        initialPageSize={20}
        columns={[
          {
            key: "time",
            header: "Waktu / User",
            sortValue: (row) => row.createdAt,
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-gray-800">{new Date(row.createdAt).toLocaleString("id-ID")}</p>
                <p className="text-xs text-gray-500">{row.user}</p>
              </div>
            )
          },
          {
            key: "action",
            header: "Aksi / Entitas",
            sortValue: (row) => row.actionType,
            render: (row) => (
              <div className="space-y-1">
                <p className="font-medium text-gray-800">{row.actionType}</p>
                <p className="text-xs text-gray-500">{row.entityType} / {row.entityId}</p>
              </div>
            )
          },
          {
            key: "changes",
            header: "Perubahan",
            render: (row) => (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sebelum</p>
                  <p className="text-sm text-gray-700">{row.before}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sesudah</p>
                  <p className="text-sm text-gray-700">{row.after}</p>
                </div>
              </div>
            )
          },
          {
            key: "source",
            header: "Sumber / Status",
            sortValue: (row) => row.reviewStatus,
            render: (row) => (
              <div className="space-y-1">
                <p className="text-sm text-gray-700">{row.source}</p>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                  {row.reviewStatus}
                </span>
              </div>
            )
          },
          {
            key: "actions",
            header: "Aksi",
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <IconActionButton icon={<FileSearch size={16} />} label="Investigasi User" onClick={() => onInvestigate(row.id)} />
                <IconActionButton icon={<MessageSquareMore size={16} />} label="Minta Klarifikasi" onClick={() => onClarify(row.id)} />
                <IconActionButton icon={<Check size={16} />} label="Tandai Ditinjau" onClick={() => onReviewed(row.id)} />
              </div>
            ),
            cellClassName: "text-right"
          }
        ] satisfies ManagementTableColumn<AuditLogItem>[]}
      />
    </Card>
  );
}

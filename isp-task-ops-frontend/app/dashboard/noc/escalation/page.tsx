"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { formatTanggal } from "@/lib/dashboard";

function getEscalationReasonBadgeClass(reason: string) {
  const normalized = reason.toLowerCase();

  if (normalized.includes("fiber")) {
    return "bg-red-100 text-red-800";
  }

  if (normalized.includes("olt")) {
    return "bg-yellow-100 text-yellow-800";
  }

  if (normalized.includes("vendor")) {
    return "bg-blue-100 text-blue-800";
  }

  if (normalized.includes("izin") || normalized.includes("gali")) {
    return "bg-orange-100 text-orange-800";
  }

  return "bg-gray-100 text-gray-800";
}

export default function NocEscalationPage() {
  const escalations = useTicketStore((state) => state.escalations);
  const fetchEscalations = useTicketStore((state) => state.fetchEscalations);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchEscalations().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Data escalation gagal dimuat.");
    });
  }, [fetchEscalations]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tiket Eskalasi</h1>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      <Card title="Daftar Eskalasi Aktif">
        <Table
          data={escalations}
          emptyText="Tidak ada tiket eskalasi."
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.ticketId}</span> },
            { header: "Role", key: "role", render: (row) => row.role.toUpperCase() },
            { header: "Type", key: "jenis", render: (row) => row.type.replaceAll("_", " ") },
            {
              header: "Alasan Eskalasi",
              key: "alasan",
              render: (row) => (
                <span className={`rounded px-2 py-1 text-xs font-semibold ${getEscalationReasonBadgeClass(row.type)}`}>
                  {row.description}
                </span>
              )
            },
            { header: "Status", key: "status", render: (row) => row.status },
            { header: "Severity", key: "severity", render: (row) => row.severity },
            { header: "Tanggal", key: "tanggal", render: (row) => formatTanggal(row.createdAt) }
          ]}
        />
      </Card>
    </div>
  );
}

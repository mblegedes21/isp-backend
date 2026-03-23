"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";
import { formatTanggal, statusTiketLabel } from "@/lib/dashboard";

export default function NocDaftarTiketPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetchTickets().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Daftar tiket gagal dimuat.");
    });
  }, [fetchTickets]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Daftar Tiket</h1>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      <Card title="Semua Tiket">
        <Table
          data={tickets}
          columns={[
            { header: "Nomor Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Lokasi", key: "lokasi", render: (row) => row.branch },
            { header: "Jenis Gangguan", key: "jenis", render: (row) => row.title },
            { header: "Status", key: "status", render: (row) => statusTiketLabel[row.status] ?? row.status },
            { header: "Leader", key: "leader", render: () => "Leader Operasional" },
            { header: "Tanggal", key: "tanggal", render: (row) => formatTanggal(row.createdAt) }
          ]}
        />
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { apiClient, extractApiMessage } from "@/lib/api";

type TechnicianHistoryRow = {
  id: string;
  ticket: string;
  title: string;
  type: string;
  bonus_per_item: number;
  total_bonus: number;
  pemasangan_baru: number;
  maintenance: number;
  tarik_kabel: number;
  status: string;
  updated_at: string;
};

type TechnicianHistoryResponse = {
  data?: TechnicianHistoryRow[];
};

const statusLabel: Record<string, string> = {
  ASSIGNED: "Belum Dikerjakan",
  MATERIAL_PREPARED: "Belum Dikerjakan",
  IN_PROGRESS: "Sedang Dikerjakan",
  ESCALATED: "Belum Selesai",
  COMPLETED: "Selesai",
  PENDING_MANAGER_REVIEW: "Menunggu Review Leader",
  CLOSED: "Selesai",
  CLOSED_WITH_LOSS: "Selesai",
  DONE: "Selesai",
};

const pekerjaanLabel: Record<string, string> = {
  PEMASANGAN_BARU: "Pemasangan Baru",
  MAINTENANCE: "Maintenance",
  TARIK_KABEL: "Tarik Kabel",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
});

export default function TechnicianHistoryPage() {
  const [historyRows, setHistoryRows] = useState<TechnicianHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiClient.get<TechnicianHistoryResponse>("/technician/history");
        setHistoryRows(Array.isArray(response.data?.data) ? response.data.data : []);
        setMessage("");
      } catch (error) {
        setMessage(extractApiMessage(error, "Riwayat insentif teknisi gagal dimuat."));
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Riwayat Pekerjaan</h1>

      {message ? <p className="text-sm text-danger">{message}</p> : null}

      <Card title="Riwayat Ticket">
        <Table
          data={historyRows}
          emptyText={loading ? "Memuat riwayat pekerjaan..." : "Belum ada riwayat pekerjaan."}
          searchableKeys={["ticket", "title", "type", "status"]}
          columns={[
            { header: "Ticket", key: "ticket", render: (row) => <span className="font-semibold">{row.ticket}</span> },
            { header: "Pekerjaan", key: "type", render: (row) => pekerjaanLabel[row.type] ?? row.type },
            { header: "Status", key: "status", render: (row) => statusLabel[row.status] ?? row.status },
            { header: "Tanggal", key: "updated_at", render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleDateString("id-ID") : "-" },
            { header: "Pemasangan Baru", key: "pemasangan_baru", render: (row) => row.pemasangan_baru },
            { header: "Maintenance", key: "maintenance", render: (row) => row.maintenance },
            { header: "Tarik Kabel", key: "tarik_kabel", render: (row) => row.tarik_kabel },
            { header: "Total Bonus", key: "total_bonus", render: (row) => rupiah.format(row.total_bonus ?? 0) },
          ]}
        />
      </Card>
    </div>
  );
}

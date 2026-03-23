"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { useTicketStore } from "@/store/useTicketStore";

export default function LeaderManajemenTicketPage() {
  const tickets = useTicketStore((state) => state.tickets);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Ticket</h1>
      <Card title="Daftar Ticket Tim">
        <Table
          data={tickets}
          columns={[
            { header: "ID Ticket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Area", key: "area", render: (row) => row.branch },
            { header: "Gangguan", key: "problem", render: (row) => row.problemType },
            { header: "Status", key: "status", render: (row) => row.status },
            {
              header: "Aksi",
              key: "action",
              render: () => (
                <Link className="font-semibold text-accent underline" href="/dashboard/leader/monitoring">
                  Pantau
                </Link>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

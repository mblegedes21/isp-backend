"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AssignTicketForm } from "@/components/ticket/AssignTicketForm";
import { ProgressTicketTable, type ProgressTicketRow } from "@/components/ticket/ProgressTicketTable";
import { ReviewTicketTable, type ReviewTicketRow } from "@/components/ticket/ReviewTicketTable";
import { useTicketStore } from "@/store/useTicketStore";
import { useStockStore } from "@/store/useStockStore";

type TicketTab = "TIKET_BARU" | "ASSIGN_TIKET" | "SEDANG_DIKERJAKAN" | "MENUNGGU_REVIEW";

const tabItems: Array<{ key: TicketTab; label: string }> = [
  { key: "TIKET_BARU", label: "Ticket Baru" },
  { key: "ASSIGN_TIKET", label: "Assign Ticket" },
  { key: "SEDANG_DIKERJAKAN", label: "Sedang Dikerjakan" },
  { key: "MENUNGGU_REVIEW", label: "Menunggu Review" }
];

export function TicketTabs() {
  const [activeTab, setActiveTab] = useState<TicketTab>("TIKET_BARU");
  const [message, setMessage] = useState("");

  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);
  const materials = useStockStore((state) => state.items);
  const ticketMaterialRequests = useStockStore((state) => state.ticketMaterialRequests);

  useEffect(() => {
    void fetchTickets().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Data tiket gagal dimuat.");
    });
  }, [fetchTickets]);

  const ticketBaruRows = tickets.filter((ticket) => {
    const normalizedStatus = String(ticket.status ?? "").toUpperCase();
    return ["CREATED", "NEW"].includes(normalizedStatus);
  });

  const progressRows = useMemo<ProgressTicketRow[]>(
    () =>
      tickets
        .filter((ticket) => ["ASSIGNED", "MATERIAL_PREPARED", "IN_PROGRESS"].includes(ticket.status))
        .map((ticket) => {
          const progressMap: Record<string, number> = {
            ASSIGNED: 20,
            MATERIAL_PREPARED: 45,
            IN_PROGRESS: 70
          };
          const durasiJam = Math.max(1, Math.floor((Date.now() - new Date(ticket.updatedAt).getTime()) / (1000 * 60 * 60)));

          return {
            ticketId: ticket.id,
            technicians: ticket.assignee || "-",
            progressPercentage: `${progressMap[ticket.status] ?? 0}%`,
            workDuration: `${durasiJam} jam`,
            photos: "Sebelum, Progress, Selesai",
            status: ticket.status
          };
        }),
    [tickets]
  );

  const reviewRows = useMemo<ReviewTicketRow[]>(
    () =>
      tickets
        .filter((ticket) => ticket.status === "PENDING_MANAGER_REVIEW")
        .map((ticket) => {
          const reqRows = ticketMaterialRequests.filter((row) => row.ticketId === ticket.id);
          const materialUsed = reqRows
            .map((row) => {
              const material = materials.find((item) => item.id === row.materialId);
              return material ? `${material.name} ${Math.floor(row.qtyRequested * 0.8)} ${material.unit}` : `${row.materialId} ${Math.floor(row.qtyRequested * 0.8)}`;
            })
            .join(", ") || "-";

          const materialRemaining = reqRows
            .map((row) => {
              const material = materials.find((item) => item.id === row.materialId);
              const remain = row.qtyRequested - Math.floor(row.qtyRequested * 0.8);
              return material ? `${material.name} ${remain} ${material.unit}` : `${row.materialId} ${remain}`;
            })
            .join(", ") || "-";

          return {
            ticketId: ticket.id,
            technicians: ticket.assignee || "-",
            materialUsed,
            materialRemaining,
            photos: "Sebelum, Progress, Selesai"
          };
        }),
    [tickets, ticketMaterialRequests, materials]
  );

  const onAssignFromTicketBaru = (ticketId: string) => {
    void ticketId;
    setActiveTab("ASSIGN_TIKET");
  };

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        {tabItems.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant={activeTab === tab.key ? "primary" : "secondary"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "TIKET_BARU" ? (
        <Card title="Daftar Tiket Baru dari NOC">
          <Table
            data={ticketBaruRows}
            emptyText="Tidak ada tiket baru."
            columns={[
              { header: "ID Tiket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
              { header: "Area", key: "area", render: (row) => row.branch },
              { header: "Jenis Gangguan", key: "problemType", render: (row) => row.problemType },
              { header: "Prioritas", key: "priority", render: (row) => row.priority },
              {
                header: "Aksi",
                key: "action",
                render: (row) => (
                  <Button type="button" variant="secondary" onClick={() => onAssignFromTicketBaru(row.id)}>
                    Tugaskan
                  </Button>
                )
              }
            ]}
          />
        </Card>
      ) : null}

      {activeTab === "ASSIGN_TIKET" ? <AssignTicketForm /> : null}

      {activeTab === "SEDANG_DIKERJAKAN" ? <ProgressTicketTable rows={progressRows} /> : null}

      {activeTab === "MENUNGGU_REVIEW" ? <ReviewTicketTable rows={reviewRows} /> : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { apiClient, extractApiMessage } from "@/lib/api";
import { formatQuantityWithUnit } from "@/lib/material-display";
import { useAuthStore } from "@/store/useAuthStore";
import { useTicketStore } from "@/store/useTicketStore";
import { useStockStore } from "@/store/useStockStore";

const statusLabel: Record<string, string> = {
  CREATED: "Belum Dikerjakan",
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
  FIBER_BACKBONE_DOWN: "Perbaikan Fiber Backbone",
  OLT_FAILURE: "Perbaikan OLT",
  CUSTOMER_VIP: "Instalasi Pelanggan VIP",
};

type TechnicianSummary = {
  pemasangan_baru?: number;
  maintenance?: number;
  tarik_kabel?: number;
  total_bonus?: number;
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
});

export default function TechnicianDashboardPage() {
  const tickets = useTicketStore((state) => state.tickets);
  const assignedTechnicianMaterials = useStockStore((state) => state.assignedTechnicianMaterials);
  const fetchAssignedTechnicianMaterials = useStockStore((state) => state.fetchAssignedTechnicianMaterials);
  const user = useAuthStore((state) => state.user);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<TechnicianSummary>({
    pemasangan_baru: 0,
    maintenance: 0,
    tarik_kabel: 0,
    total_bonus: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    void fetchAssignedTechnicianMaterials().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Gagal memuat material tugas teknisi.");
    });
  }, [fetchAssignedTechnicianMaterials]);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await apiClient.get<TechnicianSummary>("/technician/summary");
        setSummary({
          pemasangan_baru: response.data?.pemasangan_baru ?? 0,
          maintenance: response.data?.maintenance ?? 0,
          tarik_kabel: response.data?.tarik_kabel ?? 0,
          total_bonus: response.data?.total_bonus ?? 0,
        });
      } catch (error) {
        setMessage(extractApiMessage(error, "Ringkasan insentif teknisi gagal dimuat."));
      } finally {
        setLoadingSummary(false);
      }
    };

    void loadSummary();
  }, []);

  const myTickets = useMemo(
    () => tickets.filter((ticket) =>
      ticket.status !== "CREATED" &&
      (
        ticket.technicianId === user?.id ||
        ticket.technicians?.some((technician) => technician.id === user?.id)
      )
    ),
    [tickets, user?.id]
  );

  const totalTicket = myTickets.length;
  const belumDikerjakan = myTickets.filter((ticket) => ["ASSIGNED", "MATERIAL_PREPARED"].includes(ticket.status)).length;
  const sedangDikerjakan = myTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
  const belumSelesai = myTickets.filter((ticket) => !["COMPLETED", "CLOSED", "CLOSED_WITH_LOSS", "DONE"].includes(ticket.status)).length;

  const assignedMaterials = useMemo(() => {
    const mapped = assignedTechnicianMaterials.map((assignment) => ({
      ticketId: assignment.ticketNumber,
      material: assignment.materialName,
      quantity: assignment.quantityAssigned,
      unit: assignment.unit ?? "-",
      displayUnit: formatQuantityWithUnit(assignment.quantityAssigned, assignment.unit),
    }));

    if (mapped.length > 0) return mapped;

    return [
      { ticketId: "-", material: "ONU Model X", quantity: 2, unit: "unit", displayUnit: "2 unit" },
      { ticketId: "-", material: "Splitter 1:8", quantity: 1, unit: "unit", displayUnit: "1 unit" },
      { ticketId: "-", material: "Dropcore", quantity: 50, unit: "meter", displayUnit: "50 meter" }
    ];
  }, [assignedTechnicianMaterials]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold md:text-2xl">Dashboard Teknisi</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Ticket</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{totalTicket}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Belum Dikerjakan</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{belumDikerjakan}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sedang Dikerjakan</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{sedangDikerjakan}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Belum Selesai</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{belumSelesai}</p>
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pemasangan Baru</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{loadingSummary ? "..." : summary.pemasangan_baru ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Maintenance</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{loadingSummary ? "..." : summary.maintenance ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tarik Kabel</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{loadingSummary ? "..." : summary.tarik_kabel ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Bonus</p>
          <p className="mt-2 text-2xl font-bold text-app-text">{loadingSummary ? "..." : rupiah.format(summary.total_bonus ?? 0)}</p>
        </Card>
      </section>

      <Card title="Barang Dibawa">
        <Table
          data={assignedMaterials}
          searchableKeys={["ticketId", "material", "quantity", "unit"]}
          columns={[
            { header: "Ticket", key: "ticketId", render: (row) => row.ticketId },
            { header: "Material", key: "material", render: (row) => row.material },
            { header: "Quantity", key: "quantity", render: (row) => row.displayUnit }
          ]}
        />
      </Card>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Card title="Ticket Saya">
        <Table
          data={myTickets}
          searchableKeys={["id", "problemType", "branch", "status", "assignee"]}
          emptyText="Belum ada tiket yang ditugaskan."
          columns={[
            { header: "Nomor Ticket", key: "id", render: (row) => <span className="font-semibold">{row.id}</span> },
            { header: "Jenis Pekerjaan", key: "problemType", render: (row) => pekerjaanLabel[row.problemType] ?? row.problemType },
            { header: "Status", key: "status", render: (row) => statusLabel[row.status] ?? row.status },
            { header: "Leader", key: "leader", render: () => "Leader Operasional" },
            {
              header: "Aksi",
              key: "action",
              render: (row) => (
                <Link href={`/dashboard/technician/tickets/${row.id}`}>
                  <Button variant="secondary" className="w-full sm:w-auto">Detail</Button>
                </Link>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

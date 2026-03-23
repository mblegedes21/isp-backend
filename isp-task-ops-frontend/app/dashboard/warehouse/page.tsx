"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { formatQuantityWithUnit } from "@/lib/material-display";
import { useStockStore } from "@/store/useStockStore";
import type { MaterialReleaseReport, MaterialReturnChecklistRow, TicketMaterialRequestGroup } from "@/types/stock";

export default function WarehousePage() {
  const items = useStockStore((state) => state.items);
  const losses = useStockStore((state) => state.losses);
  const purchaseRequests = useStockStore((state) => state.purchaseRequests);
  const stockAudits = useStockStore((state) => state.stockAudits);
  const fetchTicketMaterialRequests = useStockStore((state) => state.fetchTicketMaterialRequests);
  const processMaterialRequest = useStockStore((state) => state.processMaterialRequest);
  const releaseTicketMaterials = useStockStore((state) => state.releaseTicketMaterials);
  const fetchMaterialReleaseReport = useStockStore((state) => state.fetchMaterialReleaseReport);
  const fetchMaterialReturnChecklist = useStockStore((state) => state.fetchMaterialReturnChecklist);
  const processMaterialReturns = useStockStore((state) => state.processMaterialReturns);

  const [requests, setRequests] = useState<TicketMaterialRequestGroup[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketMaterialRequestGroup | null>(null);
  const [releaseReport, setReleaseReport] = useState<MaterialReleaseReport | null>(null);
  const [returnRows, setReturnRows] = useState<MaterialReturnChecklistRow[]>([]);
  const [releaseQuantities, setReleaseQuantities] = useState<Record<string, number>>({});
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [selectedReleaseTechnicianId, setSelectedReleaseTechnicianId] = useState("");
  const [message, setMessage] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const totalMaterials = items.length;
  const lowStockCount = items.filter((item) => item.quantity <= item.minimum).length;
  const totalLossValue = losses.reduce((acc, item) => acc + (item.totalPrice ?? 0), 0);
  const auditDifferenceCount = stockAudits.filter((item) => item.difference !== 0).length;
  const purchaseRequestsPending = purchaseRequests.filter((item) => item.status === "pending").length;

  const loadRequests = async () => {
    try {
      const rows = await fetchTicketMaterialRequests();
      setRequests(rows);

      if (!selectedTicket && rows.length > 0) {
        setSelectedTicket(rows[0]);
      } else if (selectedTicket) {
        const matched = rows.find((row) => row.ticketDbId === selectedTicket.ticketDbId);
        setSelectedTicket(matched ?? null);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat request material tiket.");
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  useEffect(() => {
    if (!selectedTicket?.ticketDbId) {
      setReleaseReport(null);
      setReturnRows([]);
      setSelectedReleaseTechnicianId("");
      return;
    }

    setSelectedReleaseTechnicianId(selectedTicket.technicianId ?? selectedTicket.technicianOptions?.[0]?.id ?? "");

    void (async () => {
      try {
        const [report, checklist] = await Promise.all([
          fetchMaterialReleaseReport(selectedTicket.ticketDbId),
          fetchMaterialReturnChecklist(selectedTicket.ticketDbId),
        ]);
        setReleaseReport(report);
        setReturnRows(checklist.rows);
        setReleaseQuantities(
          Object.fromEntries(
            selectedTicket.requestedMaterials.map((item) => [item.id, Math.max(0, item.quantity - item.releasedQuantity)])
          )
        );
        setReturnQuantities(
          Object.fromEntries(
            checklist.rows.map((row) => [row.requestId, row.remainingQuantity])
          )
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat detail tiket.");
      }
    })();
  }, [selectedTicket?.technicianId, selectedTicket?.ticketDbId, selectedTicket?.technicianOptions]);

  const pendingReleaseRows = useMemo(
    () => selectedTicket?.requestedMaterials.filter((item) => item.status !== "RETURNED") ?? [],
    [selectedTicket]
  );
  const releaseDisabledReason = useMemo(() => {
    if (!selectedTicket) {
      return "Pilih tiket terlebih dahulu.";
    }

    if (!selectedReleaseTechnicianId) {
      return "Tiket ini belum memiliki teknisi yang valid.";
    }

    if (!pendingReleaseRows.length) {
      return "Tidak ada material untuk dikeluarkan.";
    }

    const hasValidQuantity = pendingReleaseRows.some((row) => Number(releaseQuantities[row.id] ?? 0) > 0);
    if (!hasValidQuantity) {
      return "Isi minimal satu quantity release.";
    }

    return "";
  }, [pendingReleaseRows, releaseQuantities, selectedReleaseTechnicianId, selectedTicket]);

  const onReleaseMaterials = async () => {
    if (!selectedTicket) {
      setMessage("Pilih tiket terlebih dahulu.");
      return;
    }

    const technicianId = Number(selectedReleaseTechnicianId);
    const payload = pendingReleaseRows
      .map((row) => ({
        requestId: Number(row.id),
        materialId: Number(row.materialId),
        quantity: Number(releaseQuantities[row.id] ?? 0),
      }))
      .filter((row) => Number.isFinite(row.materialId) && Number.isFinite(row.quantity) && row.quantity > 0);

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      setMessage("Teknisi wajib tersedia sebelum material tiket dapat dikeluarkan.");
      return;
    }

    if (payload.length === 0) {
      setMessage("Isi minimal satu quantity release.");
      return;
    }

    try {
      const report = await releaseTicketMaterials({
        ticketId: Number(selectedTicket.ticketDbId),
        technicianId,
        materials: payload,
      });
      setReleaseReport(report);
      setMessage("Material tiket berhasil dikeluarkan.");
      await loadRequests();
      const checklist = await fetchMaterialReturnChecklist(selectedTicket.ticketDbId);
      setReturnRows(checklist.rows);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengeluarkan material tiket.");
    }
  };

  const onProcessRequest = async (row: TicketMaterialRequestGroup) => {
    const pendingRequest = row.requestedMaterials.find((item) => item.status === "PENDING");

    setSelectedTicket(row);

    if (!pendingRequest?.id) {
      setMessage("Tidak ada request pending untuk diproses.");
      return;
    }

    try {
      setProcessingRequestId(pendingRequest.id);
      await processMaterialRequest(pendingRequest.id);
      setMessage("Request processed");
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memproses request material.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const onProcessReturn = async () => {
    if (!selectedTicket) {
      return;
    }

    const payload = returnRows
      .map((row) => ({
        requestId: row.requestId,
        quantityReturned: Number(returnQuantities[row.requestId] ?? 0),
      }))
      .filter((row) => row.quantityReturned > 0);

    if (payload.length === 0) {
      setMessage("Isi minimal satu quantity pengembalian.");
      return;
    }

    try {
      const checklist = await processMaterialReturns(selectedTicket.ticketDbId, payload);
      setReturnRows(checklist.rows);
      setMessage("Pengembalian material berhasil diverifikasi.");
      await loadRequests();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memproses pengembalian material.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Gudang</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Materials" value={totalMaterials} />
        <StatCard title="Low Stock Count" value={lowStockCount} />
        <StatCard title="Total Loss Value" value={`Rp ${totalLossValue.toLocaleString("id-ID")}`} />
        <StatCard title="Audit Difference Count" value={auditDifferenceCount} />
        <StatCard title="Purchase Requests Pending" value={purchaseRequestsPending} />
      </div>

      <Card title="Technician Material Request">
        <Table
          data={requests}
          emptyText="Belum ada request material tiket."
          enableSearch={false}
          columns={[
            { header: "Ticket ID", key: "ticket", render: (row) => row.ticketId },
            { header: "Leader", key: "leader", render: (row) => row.leaderName },
            { header: "Technicians", key: "technicians", render: (row) => row.technicians.join(", ") || "-" },
            {
              header: "Requested Materials",
              key: "materials",
              render: (row) => row.requestedMaterials.map((item) => `${item.materialName} - ${formatQuantityWithUnit(item.quantity, item.unit)} (${item.status})`).join(", ")
            },
            {
              header: "Action",
              key: "action",
              render: (row) => {
                const hasPendingRequest = row.requestedMaterials.some((item) => item.status === "PENDING");
                const pendingRequest = row.requestedMaterials.find((item) => item.status === "PENDING");

                return (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void onProcessRequest(row)}
                  disabled={!hasPendingRequest || processingRequestId === pendingRequest?.id}
                >
                  Proses
                </Button>
                );
              }
            }
          ]}
        />
      </Card>

      {selectedTicket ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title={`Release Material - ${selectedTicket.ticketId}`}>
            <div className="mb-4 space-y-1 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Leader:</span> {selectedTicket.leaderName}</p>
              <p><span className="font-semibold text-slate-900">Technicians:</span> {selectedTicket.technicians.join(", ") || "-"}</p>
            </div>

            <label className="mb-4 block space-y-1">
              <span className="text-sm font-semibold text-slate-900">Technician Target</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                value={selectedReleaseTechnicianId}
                onChange={(event) => setSelectedReleaseTechnicianId(event.target.value)}
              >
                <option value="">Pilih Teknisi</option>
                {(selectedTicket.technicianOptions ?? []).map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name}
                  </option>
                ))}
              </select>
            </label>

            <Table
              data={pendingReleaseRows}
              emptyText="Tidak ada material untuk dikeluarkan."
              enableSearch={false}
              columns={[
                { header: "Material", key: "material", render: (row) => row.materialName },
                { header: "Requested", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
                { header: "Released", key: "released", render: (row) => formatQuantityWithUnit(row.releasedQuantity, row.unit) },
                { header: "Status", key: "status", render: (row) => <Badge tone={row.status === "PENDING" ? "warning" : "success"}>{row.status}</Badge> },
                {
                  header: "Release Qty",
                  key: "releaseQty",
                  render: (row) => (
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={releaseQuantities[row.id] ?? 0}
                      onChange={(event) => setReleaseQuantities((current) => ({ ...current, [row.id]: Number(event.target.value) }))}
                    />
                  )
                }
              ]}
            />

            <div className="mt-4">
              {releaseDisabledReason ? <p className="mb-2 text-sm text-amber-700">{releaseDisabledReason}</p> : null}
              <Button type="button" onClick={() => void onReleaseMaterials()} disabled={Boolean(releaseDisabledReason)}>
                Release Materials
              </Button>
            </div>
          </Card>

          <Card title={`Material Release Report - ${selectedTicket.ticketId}`}>
            <div id="material-release-report" className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Ticket ID:</span> {releaseReport?.ticketId ?? selectedTicket.ticketId}</p>
              <p><span className="font-semibold text-slate-900">Leader:</span> {releaseReport?.leaderName ?? selectedTicket.leaderName}</p>
              <p><span className="font-semibold text-slate-900">Technicians:</span> {(releaseReport?.technicians ?? selectedTicket.technicians).join(", ") || "-"}</p>
              <Table
                data={releaseReport?.materials ?? []}
                emptyText="Belum ada material yang dikeluarkan."
                enableSearch={false}
                columns={[
                  { header: "Material", key: "material", render: (row) => row.materialName },
                  { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) }
                ]}
              />
            </div>

            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={() => window.print()}>
                Print Material Release Report
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {selectedTicket ? (
        <Card title={`Material Return Checklist - ${selectedTicket.ticketId}`}>
          <Table
            data={returnRows}
            emptyText="Belum ada material yang dikeluarkan untuk tiket ini."
            enableSearch={false}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Quantity Released", key: "released", render: (row) => formatQuantityWithUnit(row.quantityReleased, row.unit) },
              { header: "Quantity Returned", key: "returned", render: (row) => formatQuantityWithUnit(row.quantityReturned, row.unit) },
              { header: "Status", key: "status", render: (row) => <Badge tone={row.status === "Returned" ? "success" : "warning"}>{row.status}</Badge> },
              {
                header: "Return Qty",
                key: "returnQty",
                render: (row) => (
                  <input
                    type="number"
                    min={0}
                    max={row.remainingQuantity}
                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={returnQuantities[row.requestId] ?? 0}
                    onChange={(event) => setReturnQuantities((current) => ({ ...current, [row.requestId]: Number(event.target.value) }))}
                  />
                )
              }
            ]}
          />

          <div className="mt-4">
            <Button type="button" onClick={() => void onProcessReturn()}>
              Verify Returns
            </Button>
          </div>
        </Card>
      ) : null}

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}

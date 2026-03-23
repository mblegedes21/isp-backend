"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WarehouseTransactionForm } from "@/components/warehouse/WarehouseTransactionForm";
import { formatQuantityWithUnit } from "@/lib/material-display";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";
import type { TicketMaterialRequest, WarehouseTransaction, WarehouseTransactionTotals, WarehouseTransactionType } from "@/types/stock";

type TabKey = "ANTAR_GUDANG" | "PENGELUARAN_TEKNISI" | "PENJUALAN_MATERIAL";

const TAB_TO_TYPE: Record<TabKey, WarehouseTransactionType> = {
  ANTAR_GUDANG: "antar_gudang_out",
  PENGELUARAN_TEKNISI: "pengeluaran_teknisi",
  PENJUALAN_MATERIAL: "penjualan_material",
};

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
const formatDate = (value: string) => new Date(value).toLocaleString("id-ID");

const statusTone = (status: string) => {
  if (["COMPLETED", "SENT"].includes(status)) return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "neutral" as const;
};

export default function WarehousePengeluaranBarangPage() {
  const items = useStockStore((state) => state.items);
  const createWarehouseTransaction = useStockStore((state) => state.createWarehouseTransaction);
  const fetchWarehouseHistory = useStockStore((state) => state.fetchWarehouseHistory);
  const fetchTicketMaterials = useStockStore((state) => state.fetchTicketMaterials);
  const releaseTicketMaterials = useStockStore((state) => state.releaseTicketMaterials);
  const tickets = useTicketStore((state) => state.tickets);
  const fetchTickets = useTicketStore((state) => state.fetchTickets);

  const [tab, setTab] = useState<TabKey>("ANTAR_GUDANG");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [histories, setHistories] = useState<Record<WarehouseTransactionType, WarehouseTransaction[]>>({
    antar_gudang_in: [],
    pengembalian_teknisi: [],
    pembelian_material: [],
    antar_gudang_out: [],
    pengeluaran_teknisi: [],
    penjualan_material: [],
    technician_out: [],
    technician_return: [],
  });
  const [totalsByType, setTotalsByType] = useState<Record<WarehouseTransactionType, WarehouseTransactionTotals>>({
    antar_gudang_in: { quantity: 0, value: 0 },
    pengembalian_teknisi: { quantity: 0, value: 0 },
    pembelian_material: { quantity: 0, value: 0 },
    antar_gudang_out: { quantity: 0, value: 0 },
    pengeluaran_teknisi: { quantity: 0, value: 0 },
    penjualan_material: { quantity: 0, value: 0 },
    technician_out: { quantity: 0, value: 0 },
    technician_return: { quantity: 0, value: 0 },
  });

  const firstMaterialId = items[0]?.id ?? "";

  const [transferMaterialId, setTransferMaterialId] = useState(firstMaterialId);
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [transferUnitPrice, setTransferUnitPrice] = useState(0);
  const [destinationBranch, setDestinationBranch] = useState("CABANG CIKARANG");
  const [transferNotes, setTransferNotes] = useState("");

  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [issueNotes, setIssueNotes] = useState("");
  const [ticketMaterials, setTicketMaterials] = useState<TicketMaterialRequest[]>([]);
  const [releaseQuantities, setReleaseQuantities] = useState<Record<string, number>>({});
  const [ticketMaterialsLoading, setTicketMaterialsLoading] = useState(false);

  const [saleMaterialId, setSaleMaterialId] = useState(firstMaterialId);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState(0);
  const [customer, setCustomer] = useState("");
  const [saleNotes, setSaleNotes] = useState("");

  useEffect(() => {
    if (!tickets.length) {
      void fetchTickets();
    }
  }, [fetchTickets, tickets.length]);

  useEffect(() => {
    if (!firstMaterialId) {
      return;
    }

    setTransferMaterialId((current) => current || firstMaterialId);
    setSaleMaterialId((current) => current || firstMaterialId);
  }, [firstMaterialId]);

  const loadHistory = async (type: WarehouseTransactionType) => {
    setHistoryLoading(true);
    try {
      const history = await fetchWarehouseHistory(type);
      setHistories((current) => ({ ...current, [type]: history.rows }));
      setTotalsByType((current) => ({ ...current, [type]: history.totals }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat riwayat transaksi.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory(TAB_TO_TYPE[tab]);
  }, [tab]);

  useEffect(() => {
    if (!selectedTicketId) {
      setTicketMaterials([]);
      setReleaseQuantities({});
      return;
    }

    setTicketMaterialsLoading(true);
    void (async () => {
      try {
        const rows = await fetchTicketMaterials(selectedTicketId);
        setTicketMaterials(rows);
        setReleaseQuantities(
          Object.fromEntries(
            rows.map((row) => [
              row.id,
              Math.max(0, (row.qtyRequested ?? 0) - (row.releasedQuantity ?? 0))
            ])
          )
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Gagal memuat material tiket.");
        setTicketMaterials([]);
        setReleaseQuantities({});
      } finally {
        setTicketMaterialsLoading(false);
      }
    })();
  }, [fetchTicketMaterials, selectedTicketId]);

  const transferItem = useMemo(
    () => items.find((item) => item.id === transferMaterialId) ?? items[0] ?? null,
    [items, transferMaterialId]
  );
  const saleItem = useMemo(
    () => items.find((item) => item.id === saleMaterialId) ?? items[0] ?? null,
    [items, saleMaterialId]
  );
  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets]
  );
  const pendingTicketMaterials = useMemo(
    () => ticketMaterials.filter((row) => ((row.qtyRequested ?? 0) - (row.releasedQuantity ?? 0)) > 0),
    [ticketMaterials]
  );
  const selectedTechnicianNames = useMemo(() => {
    if (selectedTicket?.technicians?.length) {
      return selectedTicket.technicians.map((technician) => technician.name).filter(Boolean).join(", ");
    }

    return selectedTicket?.assignee || "";
  }, [selectedTicket]);
  const normalizedReleaseMaterials = useMemo(
    () => pendingTicketMaterials
      .map((row) => ({
        requestId: Number(row.id),
        materialId: Number(row.materialId),
        quantity: Number(releaseQuantities[row.id] ?? 0),
      }))
      .filter((row) => Number.isFinite(row.materialId) && Number.isFinite(row.quantity) && row.quantity > 0),
    [pendingTicketMaterials, releaseQuantities]
  );
  const technicianIssueDisabledReason = useMemo(() => {
    if (loading) {
      return "Pengeluaran material sedang diproses.";
    }

    if (!selectedTicketId || !selectedTicket) {
      return "Pilih tiket terlebih dahulu.";
    }

    if (!selectedTechnicianId) {
      return "Tiket ini belum memiliki teknisi yang valid.";
    }

    if (pendingTicketMaterials.length === 0) {
      return "Tidak ada material request aktif untuk tiket ini.";
    }

    if (normalizedReleaseMaterials.length === 0) {
      return "Isi minimal satu quantity release yang valid.";
    }

    return "";
  }, [loading, normalizedReleaseMaterials.length, pendingTicketMaterials.length, selectedTechnicianId, selectedTicket, selectedTicketId]);

  useEffect(() => {
    const nextTechnicianId = selectedTicketId
      ? selectedTicket?.technicianId ?? selectedTicket?.technicians?.[0]?.id ?? ""
      : "";

    setSelectedTechnicianId(nextTechnicianId);
    console.log("selectedTicketId", selectedTicketId);
    console.log("selectedTechnicianId", nextTechnicianId);
  }, [selectedTicket, selectedTicketId]);

  const currentType = TAB_TO_TYPE[tab];
  const currentRows = histories[currentType] ?? [];
  const totals = totalsByType[currentType] ?? { quantity: 0, value: 0 };

  const submitTransfer = async () => {
    if (!transferItem) {
      setMessage("Material belum tersedia.");
      return;
    }

    setLoading(true);
    try {
      await createWarehouseTransaction({
        materialId: transferItem.id,
        transactionType: "antar_gudang_out",
        quantity: transferQuantity,
        unitPrice: transferUnitPrice || transferItem.purchasePrice || 0,
        destinationBranch,
        notes: transferNotes,
      });
      setMessage("Pengeluaran antar gudang berhasil disimpan.");
      setTransferNotes("");
      await loadHistory("antar_gudang_out");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pengeluaran antar gudang.");
    } finally {
      setLoading(false);
    }
  };

  const submitTechnicianIssue = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    console.log("WAREHOUSE RELEASE FORM SUBMIT");

    if (!selectedTicket) {
      const nextMessage = "Pilih tiket terlebih dahulu.";
      console.warn(nextMessage);
      setMessage(nextMessage);
      return;
    }

    const ticketDbId = Number(selectedTicket.dbId);
    const technicianId = Number(selectedTechnicianId);

    if (!Number.isInteger(ticketDbId) || ticketDbId <= 0) {
      const nextMessage = "Ticket ID tidak valid. Muat ulang data tiket lalu coba lagi.";
      console.warn(nextMessage, { selectedTicketId, selectedTicket });
      setMessage(nextMessage);
      return;
    }

    if (!Number.isInteger(technicianId) || technicianId <= 0) {
      const nextMessage = "Teknisi wajib tersedia sebelum pengeluaran material disimpan.";
      console.warn(nextMessage, { selectedTicket });
      setMessage(nextMessage);
      return;
    }

    if (normalizedReleaseMaterials.length === 0) {
      const nextMessage = pendingTicketMaterials.length === 0
        ? "Tidak ada material tiket yang siap dikeluarkan."
        : "Isi minimal satu quantity release yang valid.";
      console.warn(nextMessage, { pendingTicketMaterials, releaseQuantities });
      setMessage(nextMessage);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await releaseTicketMaterials({
        ticketId: ticketDbId,
        technicianId,
        materials: normalizedReleaseMaterials,
      });
      const rows = await fetchTicketMaterials(String(ticketDbId));
      setTicketMaterials(rows);
      setReleaseQuantities(
        Object.fromEntries(
          rows.map((row) => [
            row.id,
            Math.max(0, (row.qtyRequested ?? 0) - (row.releasedQuantity ?? 0))
          ])
        )
      );
      setMessage("Pengeluaran teknisi berhasil disimpan.");
      setIssueNotes("");
      await loadHistory("pengeluaran_teknisi");
    } catch (error) {
      console.error("WAREHOUSE RELEASE SUBMIT FAILED", error);
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pengeluaran teknisi.");
    } finally {
      setLoading(false);
    }
  };

  const submitSale = async () => {
    if (!saleItem) {
      setMessage("Material belum tersedia.");
      return;
    }

    setLoading(true);
    try {
      await createWarehouseTransaction({
        materialId: saleItem.id,
        transactionType: "penjualan_material",
        quantity: saleQuantity,
        unitPrice: saleUnitPrice || saleItem.purchasePrice || 0,
        customer,
        notes: saleNotes,
      });
      setMessage("Penjualan material berhasil disimpan.");
      setSaleNotes("");
      await loadHistory("penjualan_material");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan penjualan material.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pengeluaran Barang</h1>

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "ANTAR_GUDANG" ? "primary" : "secondary"} onClick={() => setTab("ANTAR_GUDANG")}>Antar Gudang</Button>
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "PENGELUARAN_TEKNISI" ? "primary" : "secondary"} onClick={() => setTab("PENGELUARAN_TEKNISI")}>Pengeluaran Teknisi</Button>
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "PENJUALAN_MATERIAL" ? "primary" : "secondary"} onClick={() => setTab("PENJUALAN_MATERIAL")}>Penjualan Material</Button>
      </div>

      {tab === "ANTAR_GUDANG" ? (
        <Card title="Form Pengeluaran Antar Gudang">
          <WarehouseTransactionForm
            title="Pengeluaran Antar Gudang"
            items={items}
            materialId={transferItem?.id ?? ""}
            quantity={transferQuantity}
            unitPrice={transferUnitPrice || transferItem?.purchasePrice || 0}
            description={transferNotes}
            onMaterialChange={setTransferMaterialId}
            onQuantityChange={setTransferQuantity}
            onUnitPriceChange={setTransferUnitPrice}
            onDescriptionChange={setTransferNotes}
            onSubmit={() => void submitTransfer()}
            submitLabel="Simpan Pengeluaran"
            submitting={loading}
            additionalFields={
              <label className="mb-[14px] space-y-1">
                <span className="text-sm font-semibold text-slate-900">Destination Branch</span>
                <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={destinationBranch} onChange={(event) => setDestinationBranch(event.target.value)} />
              </label>
            }
          />
        </Card>
      ) : null}

      {tab === "PENGELUARAN_TEKNISI" ? (
        <Card title="Form Pengeluaran Teknisi">
          <form className="ml-0 mr-auto w-full max-w-[1100px] space-y-4" onSubmit={(event) => void submitTechnicianIssue(event)}>
            <h2 className="text-lg font-bold text-slate-900">Pengeluaran Teknisi</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="mb-[14px] space-y-1">
                <span className="text-sm font-semibold text-slate-900">Ticket ID</span>
                <select
                    className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  value={selectedTicketId}
                  onChange={(event) => {
                    setSelectedTicketId(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">Pilih Ticket</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.id} - {ticket.assignee || "Belum assigned"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mb-[14px] space-y-1">
                <span className="text-sm font-semibold text-slate-900">Technicians</span>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  value={selectedTechnicianId}
                  onChange={(event) => setSelectedTechnicianId(event.target.value)}
                  disabled={!selectedTicket}
                >
                  <option value="">{selectedTicket ? "Pilih Teknisi" : "Pilih tiket terlebih dahulu"}</option>
                  {(selectedTicket?.technicians ?? []).map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                  {selectedTicket && (!selectedTicket.technicians || selectedTicket.technicians.length === 0) && selectedTicket.technicianId ? (
                    <option value={selectedTicket.technicianId}>{selectedTechnicianNames || "Teknisi Ticket"}</option>
                  ) : null}
                </select>
              </label>

              <label className="mb-[14px] md:col-span-2">
                <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
                <textarea
                  rows={4}
                  className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900"
                  placeholder="Contoh: Catatan tambahan mengenai kondisi material atau transaksi gudang."
                  value={issueNotes}
                  onChange={(event) => setIssueNotes(event.target.value)}
                />
              </label>
            </div>

            <Table
              data={pendingTicketMaterials}
              emptyText={ticketMaterialsLoading ? "Memuat material tiket..." : selectedTicketId ? "Tidak ada material request aktif untuk tiket ini." : "Pilih tiket untuk melihat seluruh material request."}
              enableSearch={false}
              columns={[
                { header: "Material", key: "material", render: (row) => row.materialName ?? "-" },
                { header: "Requested", key: "requested", render: (row) => formatQuantityWithUnit(row.qtyRequested, row.unit) },
                { header: "Released", key: "released", render: (row) => formatQuantityWithUnit(row.releasedQuantity ?? 0, row.unit) },
                { header: "Remaining", key: "remaining", render: (row) => formatQuantityWithUnit(Math.max(0, (row.qtyRequested ?? 0) - (row.releasedQuantity ?? 0)), row.unit) },
                { header: "Requested By", key: "requested_by", render: (row) => row.requestedByName ?? "-" },
                {
                  header: "Release Qty",
                  key: "release_qty",
                  render: (row) => (
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, (row.qtyRequested ?? 0) - (row.releasedQuantity ?? 0))}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={releaseQuantities[row.id] ?? 0}
                      onChange={(event) =>
                        setReleaseQuantities((current) => ({
                          ...current,
                          [row.id]: Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : 0,
                        }))
                      }
                    />
                  )
                },
              ]}
            />

            {technicianIssueDisabledReason ? (
              <p className="text-sm text-amber-700">{technicianIssueDisabledReason}</p>
            ) : null}

            <Button type="submit" className="px-4 py-2 text-sm" disabled={Boolean(technicianIssueDisabledReason)}>
              {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </form>
        </Card>
      ) : null}

      {tab === "PENJUALAN_MATERIAL" ? (
        <Card title="Form Penjualan Material">
          <WarehouseTransactionForm
            title="Penjualan Material"
            items={items}
            materialId={saleItem?.id ?? ""}
            quantity={saleQuantity}
            unitPrice={saleUnitPrice || saleItem?.purchasePrice || 0}
            description={saleNotes}
            onMaterialChange={setSaleMaterialId}
            onQuantityChange={setSaleQuantity}
            onUnitPriceChange={setSaleUnitPrice}
            onDescriptionChange={setSaleNotes}
            onSubmit={() => void submitSale()}
            submitLabel="Simpan Penjualan"
            submitting={loading}
            additionalFields={
              <label className="mb-[14px] space-y-1">
                <span className="text-sm font-semibold text-slate-900">Customer</span>
                <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={customer} onChange={(event) => setCustomer(event.target.value)} />
              </label>
            }
          />
        </Card>
      ) : null}

      <Card title="Riwayat Transaksi">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Quantity</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totals.quantity}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Value</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totals.value)}</p>
          </div>
        </div>

        {tab === "ANTAR_GUDANG" ? (
          <Table
            data={currentRows}
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada pengeluaran antar gudang."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Destination Branch", key: "destination_branch", render: (row) => row.destinationBranch ?? "-" },
              { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
              { header: "Unit Price", key: "unit_price", render: (row) => formatCurrency(row.unitPrice) },
              { header: "Total Price", key: "total_price", render: (row) => formatCurrency(row.totalValue ?? row.totalPrice) },
              { header: "Date", key: "created_at", render: (row) => formatDate(row.createdAt) },
              { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            ]}
          />
        ) : null}

        {tab === "PENGELUARAN_TEKNISI" ? (
          <Table
            data={currentRows}
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada pengeluaran teknisi."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Technician", key: "technician", render: (row) => row.technicianName ?? "-" },
              { header: "Ticket ID", key: "ticket", render: (row) => row.ticketNumber ?? row.ticketId ?? "-" },
              { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
              { header: "Total Value", key: "total_value", render: (row) => formatCurrency(row.totalValue ?? row.totalPrice) },
              { header: "Date", key: "created_at", render: (row) => formatDate(row.createdAt) },
              { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            ]}
          />
        ) : null}

        {tab === "PENJUALAN_MATERIAL" ? (
          <Table
            data={currentRows}
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada penjualan material."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Customer", key: "customer", render: (row) => row.customer ?? "-" },
              { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
              { header: "Unit Price", key: "unit_price", render: (row) => formatCurrency(row.unitPrice) },
              { header: "Total Price", key: "total_price", render: (row) => formatCurrency(row.totalValue ?? row.totalPrice) },
              { header: "Date", key: "created_at", render: (row) => formatDate(row.createdAt) },
              { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            ]}
          />
        ) : null}
      </Card>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}

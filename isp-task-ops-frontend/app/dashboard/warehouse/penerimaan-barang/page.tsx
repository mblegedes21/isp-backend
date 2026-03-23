"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WarehouseTransactionForm } from "@/components/warehouse/WarehouseTransactionForm";
import { formatQuantityWithUnit } from "@/lib/material-display";
import { useStockStore } from "@/store/useStockStore";
import { useTicketStore } from "@/store/useTicketStore";
import type { WarehouseTransaction, WarehouseTransactionTotals, WarehouseTransactionType } from "@/types/stock";

type TabKey = "ANTAR_GUDANG" | "PENGEMBALIAN_TEKNISI" | "PEMBELIAN_MATERIAL";

const TAB_TO_TYPE: Record<TabKey, WarehouseTransactionType> = {
  ANTAR_GUDANG: "antar_gudang_in",
  PENGEMBALIAN_TEKNISI: "pengembalian_teknisi",
  PEMBELIAN_MATERIAL: "pembelian_material",
};

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;
const formatDate = (value: string) => new Date(value).toLocaleString("id-ID");

const statusTone = (status: string) => {
  if (["COMPLETED", "RECEIVED"].includes(status)) return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "neutral" as const;
};

export default function WarehousePenerimaanBarangPage() {
  const items = useStockStore((state) => state.items);
  const createWarehouseTransaction = useStockStore((state) => state.createWarehouseTransaction);
  const fetchWarehouseHistory = useStockStore((state) => state.fetchWarehouseHistory);
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
  const [sourceBranch, setSourceBranch] = useState("CABANG PUSAT");
  const [transferNotes, setTransferNotes] = useState("");

  const [returnMaterialId, setReturnMaterialId] = useState(firstMaterialId);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnTicketId, setReturnTicketId] = useState("");
  const [returnTechnicianId, setReturnTechnicianId] = useState("");
  const [returnCondition, setReturnCondition] = useState("BAIK");
  const [returnNotes, setReturnNotes] = useState("");

  const [purchaseMaterialId, setPurchaseMaterialId] = useState(firstMaterialId);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseUnitPrice, setPurchaseUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [purchaseRequestId, setPurchaseRequestId] = useState("");
  const [purchaseNotes, setPurchaseNotes] = useState("");

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
    setReturnMaterialId((current) => current || firstMaterialId);
    setPurchaseMaterialId((current) => current || firstMaterialId);
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
    const selectedTicket = tickets.find((ticket) => ticket.id === returnTicketId);
    setReturnTechnicianId(selectedTicket?.technicianId ?? selectedTicket?.technicians?.[0]?.id ?? "");
  }, [returnTicketId, tickets]);

  const transferItem = useMemo(
    () => items.find((item) => item.id === transferMaterialId) ?? items[0] ?? null,
    [items, transferMaterialId]
  );
  const returnItem = useMemo(
    () => items.find((item) => item.id === returnMaterialId) ?? items[0] ?? null,
    [items, returnMaterialId]
  );
  const purchaseItem = useMemo(
    () => items.find((item) => item.id === purchaseMaterialId) ?? items[0] ?? null,
    [items, purchaseMaterialId]
  );
  const selectedReturnTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === returnTicketId) ?? null,
    [returnTicketId, tickets]
  );

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
        transactionType: "antar_gudang_in",
        quantity: transferQuantity,
        unitPrice: transferUnitPrice || transferItem.purchasePrice || 0,
        sourceBranch,
        notes: transferNotes,
      });
      setMessage("Penerimaan antar gudang berhasil disimpan.");
      setTransferNotes("");
      await loadHistory("antar_gudang_in");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan penerimaan antar gudang.");
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async () => {
    if (!returnItem) {
      setMessage("Material belum tersedia.");
      return;
    }

    if (!returnTechnicianId) {
      setMessage("Pilih teknisi terlebih dahulu.");
      return;
    }

    if (!returnTicketId) {
      setMessage("Pilih ticket terlebih dahulu.");
      return;
    }

    const returnTicketDbId = selectedReturnTicket?.dbId;
    if (!returnTicketDbId) {
      setMessage("Ticket ID tidak valid. Muat ulang data tiket lalu coba lagi.");
      return;
    }

    setLoading(true);
    try {
      await createWarehouseTransaction({
        materialId: returnItem.id,
        transactionType: "pengembalian_teknisi",
        quantity: returnQuantity,
        unitPrice: returnItem.purchasePrice || 0,
        technicianId: returnTechnicianId,
        ticketId: returnTicketDbId,
        condition: returnCondition,
        notes: returnNotes,
      });
      setMessage("Pengembalian teknisi berhasil disimpan.");
      setReturnNotes("");
      await loadHistory("pengembalian_teknisi");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pengembalian teknisi.");
    } finally {
      setLoading(false);
    }
  };

  const submitPurchase = async () => {
    if (!purchaseItem) {
      setMessage("Material belum tersedia.");
      return;
    }

    setLoading(true);
    try {
      await createWarehouseTransaction({
        materialId: purchaseItem.id,
        transactionType: "pembelian_material",
        quantity: purchaseQuantity,
        unitPrice: purchaseUnitPrice || purchaseItem.purchasePrice || 0,
        supplier,
        purchaseRequestId: purchaseRequestId || undefined,
        notes: purchaseNotes,
      });
      setMessage("Pembelian material berhasil disimpan.");
      setPurchaseNotes("");
      await loadHistory("pembelian_material");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan pembelian material.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Penerimaan Barang</h1>

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "ANTAR_GUDANG" ? "primary" : "secondary"} onClick={() => setTab("ANTAR_GUDANG")}>Antar Gudang</Button>
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "PENGEMBALIAN_TEKNISI" ? "primary" : "secondary"} onClick={() => setTab("PENGEMBALIAN_TEKNISI")}>Pengembalian Teknisi</Button>
        <Button type="button" className="px-4 py-2 text-sm" variant={tab === "PEMBELIAN_MATERIAL" ? "primary" : "secondary"} onClick={() => setTab("PEMBELIAN_MATERIAL")}>Pembelian Material</Button>
      </div>

      {tab === "ANTAR_GUDANG" ? (
        <Card title="Form Penerimaan Antar Gudang">
          <WarehouseTransactionForm
            title="Penerimaan Antar Gudang"
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
            submitLabel="Simpan Penerimaan"
            submitting={loading}
            additionalFields={
              <label className="mb-[14px] space-y-1">
                <span className="text-sm font-semibold text-slate-900">From Branch</span>
                <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={sourceBranch} onChange={(event) => setSourceBranch(event.target.value)} />
              </label>
            }
          />
        </Card>
      ) : null}

      {tab === "PENGEMBALIAN_TEKNISI" ? (
        <Card title="Form Pengembalian Teknisi">
          <WarehouseTransactionForm
            title="Pengembalian Teknisi"
            items={items}
            materialId={returnItem?.id ?? ""}
            quantity={returnQuantity}
            unitPrice={returnItem?.purchasePrice || 0}
            description={returnNotes}
            onMaterialChange={setReturnMaterialId}
            onQuantityChange={setReturnQuantity}
            onUnitPriceChange={() => undefined}
            onDescriptionChange={setReturnNotes}
            onSubmit={() => void submitReturn()}
            submitLabel="Simpan Pengembalian"
            submitting={loading}
            showPricing={false}
            additionalFields={
              <>
                <label className="mb-[14px] space-y-1">
                  <span className="text-sm font-semibold text-slate-900">Technician</span>
                  <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={returnTechnicianId} onChange={(event) => setReturnTechnicianId(event.target.value)}>
                    <option value="">Pilih Teknisi</option>
                    {tickets
                      .filter((ticket) => ticket.technicianId)
                      .map((ticket) => (
                        <option key={`${ticket.id}-${ticket.technicianId}`} value={ticket.technicianId}>
                          {ticket.assignee || "Teknisi"} - {ticket.id}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="mb-[14px] space-y-1">
                  <span className="text-sm font-semibold text-slate-900">Ticket ID</span>
                  <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={returnTicketId} onChange={(event) => setReturnTicketId(event.target.value)}>
                    <option value="">Pilih Ticket</option>
                    {tickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.id} - {ticket.assignee || "Belum assigned"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mb-[14px] space-y-1">
                  <span className="text-sm font-semibold text-slate-900">Condition</span>
                  <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={returnCondition} onChange={(event) => setReturnCondition(event.target.value)}>
                    <option value="BAIK">Baik</option>
                    <option value="RUSAK_RINGAN">Rusak Ringan</option>
                    <option value="RUSAK_BERAT">Rusak Berat</option>
                  </select>
                </label>
              </>
            }
          />
        </Card>
      ) : null}

      {tab === "PEMBELIAN_MATERIAL" ? (
        <Card title="Form Pembelian Material">
          <WarehouseTransactionForm
            title="Pembelian Material"
            items={items}
            materialId={purchaseItem?.id ?? ""}
            quantity={purchaseQuantity}
            unitPrice={purchaseUnitPrice || purchaseItem?.purchasePrice || 0}
            description={purchaseNotes}
            onMaterialChange={setPurchaseMaterialId}
            onQuantityChange={setPurchaseQuantity}
            onUnitPriceChange={setPurchaseUnitPrice}
            onDescriptionChange={setPurchaseNotes}
            onSubmit={() => void submitPurchase()}
            submitLabel="Simpan Pembelian"
            submitting={loading}
            additionalFields={
              <>
                <label className="mb-[14px] space-y-1">
                  <span className="text-sm font-semibold text-slate-900">Supplier</span>
                  <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={supplier} onChange={(event) => setSupplier(event.target.value)} />
                </label>
                <label className="mb-[14px] space-y-1">
                  <span className="text-sm font-semibold text-slate-900">Purchase Request ID</span>
                  <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={purchaseRequestId} onChange={(event) => setPurchaseRequestId(event.target.value)} />
                </label>
              </>
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
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada transaksi antar gudang masuk."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "From Branch", key: "source_branch", render: (row) => row.sourceBranch ?? "-" },
              { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
              { header: "Unit Price", key: "unit_price", render: (row) => formatCurrency(row.unitPrice) },
              { header: "Total Price", key: "total_price", render: (row) => formatCurrency(row.totalValue ?? row.totalPrice) },
              { header: "Date", key: "created_at", render: (row) => formatDate(row.createdAt) },
              { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
            ]}
          />
        ) : null}

        {tab === "PENGEMBALIAN_TEKNISI" ? (
          <Table
            data={currentRows}
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada pengembalian teknisi."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Technician", key: "technician", render: (row) => row.technicianName ?? "-" },
              { header: "Ticket ID", key: "ticket", render: (row) => row.ticketNumber ?? row.ticketId ?? "-" },
              { header: "Quantity", key: "quantity", render: (row) => formatQuantityWithUnit(row.quantity, row.unit) },
              { header: "Total Value", key: "total_value", render: (row) => formatCurrency(row.totalValue ?? row.totalPrice) },
              { header: "Condition", key: "condition", render: (row) => row.condition ?? "-" },
              { header: "Date", key: "created_at", render: (row) => formatDate(row.createdAt) },
            ]}
          />
        ) : null}

        {tab === "PEMBELIAN_MATERIAL" ? (
          <Table
            data={currentRows}
            emptyText={historyLoading ? "Memuat riwayat..." : "Belum ada pembelian material."}
            columns={[
              { header: "Material", key: "material", render: (row) => row.materialName },
              { header: "Supplier", key: "supplier", render: (row) => row.supplier ?? "-" },
              { header: "Purchase Request ID", key: "purchase_request", render: (row) => row.purchaseRequestId ?? "-" },
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

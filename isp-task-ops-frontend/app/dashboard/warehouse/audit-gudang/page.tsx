"use client";

import { useEffect, useMemo, useState } from "react";
import { Ban, Check, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useStockStore } from "@/store/useStockStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuditGudangPage() {
  const user = useAuthStore((state) => state.user);
  const items = useStockStore((state) => state.items);
  const stockAudits = useStockStore((state) => state.stockAudits);
  const performStockAudit = useStockStore((state) => state.performStockAudit);
  const approveStockAudit = useStockStore((state) => state.approveStockAudit);
  const rejectStockAudit = useStockStore((state) => state.rejectStockAudit);
  const createLossFromAudit = useStockStore((state) => state.createLossFromAudit);

  const [materialId, setMaterialId] = useState(items[0]?.id ?? "");
  const [physicalStock, setPhysicalStock] = useState(0);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const selectedMaterial = useMemo(
    () => items.find((item) => item.id === materialId) ?? items[0] ?? null,
    [items, materialId]
  );

  useEffect(() => {
    if (selectedMaterial) {
      setPhysicalStock(selectedMaterial.quantity);
    }
  }, [selectedMaterial?.id]);

  const systemStock = selectedMaterial?.quantity ?? 0;
  const unitPrice = selectedMaterial?.purchasePrice ?? 0;
  const difference = physicalStock - systemStock;
  const totalDifferenceValue = difference * unitPrice;

  const onSubmit = async () => {
    if (!user?.branchId || !selectedMaterial) {
      setMessage("Material atau branch belum tersedia.");
      return;
    }

    try {
      await performStockAudit({
        materialId: selectedMaterial.id,
        branchId: user.branchId,
        physicalStock,
        unitPrice,
        notes
      });
      setMessage("Perform Stock Audit works.");
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat audit gudang.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit Gudang</h1>

      <Card title="Form Audit Stok">
        <div className="ml-0 mr-auto grid w-full max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-2">
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Material</span>
            <select className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={selectedMaterial?.id ?? ""} onChange={(event) => setMaterialId(event.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.materialName ?? item.name}</option>
              ))}
            </select>
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Branch</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={user?.branchName ?? "-"} readOnly />
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">System Stock</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={systemStock} readOnly />
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Physical Stock</span>
            <input type="number" min={0} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={physicalStock} onChange={(event) => setPhysicalStock(Number(event.target.value))} />
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Difference</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={difference} readOnly />
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Unit Price</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={`Rp ${unitPrice.toLocaleString("id-ID")}`} readOnly />
          </label>
          <label className="mb-[14px] space-y-1">
            <span className="text-sm font-semibold text-slate-900">Total Difference Value</span>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={`Rp ${totalDifferenceValue.toLocaleString("id-ID")}`} readOnly />
          </label>
          <label className="mb-[14px] md:col-span-2">
            <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
            <textarea rows={4} className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900" placeholder="Contoh: Catatan tambahan mengenai kondisi material atau transaksi gudang." value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <div className="md:col-span-2">
            <Button type="button" className="px-4 py-2 text-sm" onClick={() => void onSubmit()}>
              Simpan Audit
            </Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </Card>

      <Card title="Riwayat Audit Gudang">
        <Table
          data={stockAudits}
          emptyText="Belum ada audit gudang."
          enableSearch={false}
          columns={[
            { header: "Material", key: "material", render: (row) => row.materialName },
            { header: "Branch", key: "branch", render: (row) => row.branchName },
            { header: "System", key: "system", render: (row) => row.systemStock },
            { header: "Physical", key: "physical", render: (row) => row.physicalStock },
            { header: "Diff", key: "difference", render: (row) => row.difference },
            { header: "Value", key: "value", render: (row) => `Rp ${row.totalDifferenceValue.toLocaleString("id-ID")}` },
            { header: "Status", key: "status", render: (row) => <Badge tone={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}>{row.status.toUpperCase()}</Badge> },
            {
              header: "Actions",
              key: "actions",
              render: (row) => (
                <div className="flex gap-2">
                  <IconActionButton icon={<Check className="h-4 w-4" />} label="Approve Audit" onClick={() => void approveStockAudit(row.id)} disabled={row.status !== "pending"} />
                  <IconActionButton icon={<Ban className="h-4 w-4" />} label="Reject Audit" tone="danger" onClick={() => void rejectStockAudit(row.id, "Audit tidak disetujui.")} disabled={row.status !== "pending"} />
                  {row.canCreateLoss ? (
                    <IconActionButton icon={<ShieldAlert className="h-4 w-4" />} label="Create Loss Report" onClick={() => void createLossFromAudit(row.id)} />
                  ) : null}
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}

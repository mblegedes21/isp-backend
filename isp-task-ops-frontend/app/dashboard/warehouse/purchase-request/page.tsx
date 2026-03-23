"use client";

import { useMemo, useState } from "react";
import { Ban, Check, Eye, RotateCcw, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { useStockStore } from "@/store/useStockStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { PurchaseRequest } from "@/types/stock";

export default function PurchaseRequestPage() {
  const user = useAuthStore((state) => state.user);
  const items = useStockStore((state) => state.items);
  const purchaseRequests = useStockStore((state) => state.purchaseRequests);
  const createPurchaseRequest = useStockStore((state) => state.createPurchaseRequest);
  const approvePurchaseRequest = useStockStore((state) => state.approvePurchaseRequest);
  const rejectPurchaseRequest = useStockStore((state) => state.rejectPurchaseRequest);
  const resendPurchaseRequest = useStockStore((state) => state.resendPurchaseRequest);

  const [materialId, setMaterialId] = useState(items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);

  const selectedMaterial = useMemo(
    () => items.find((item) => item.id === materialId) ?? items[0] ?? null,
    [items, materialId]
  );

  const isWarehouse = user?.role === "ADMIN_GUDANG";
  const isManager = user?.role === "MANAGER";

  const statusTone = (status: PurchaseRequest["status"]) => {
    if (status === "approved" || status === "received") {
      return "success" as const;
    }

    if (status === "rejected") {
      return "danger" as const;
    }

    return "warning" as const;
  };

  const onSubmit = async () => {
    if (!user?.branchId || !selectedMaterial) {
      setMessage("Material atau branch tidak tersedia.");
      return;
    }

    try {
      await createPurchaseRequest({
        materialId: selectedMaterial.id,
        branchId: user.branchId,
        quantity,
        estimatedPrice: quantity * (selectedMaterial.purchasePrice ?? 0),
        supplier,
        notes
      });
      setMessage("Purchase request berhasil dibuat.");
      setNotes("");
      setSupplier("");
      setQuantity(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membuat purchase request.");
    }
  };

  const onApprove = async (id: string) => {
    try {
      await approvePurchaseRequest(id);
      setMessage("Purchase request berhasil disetujui.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyetujui purchase request.");
    }
  };

  const onReject = async (id: string) => {
    try {
      await rejectPurchaseRequest(id, "Ditolak manager.");
      setMessage("Purchase request berhasil ditolak.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menolak purchase request.");
    }
  };

  const onResend = async (id: string) => {
    try {
      await resendPurchaseRequest(id);
      setMessage("Purchase request berhasil dikirim ulang.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mengirim ulang purchase request.");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Purchase Request</h1>

      {isWarehouse ? (
        <Card title="Ajukan Pembelian Material">
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
              <span className="text-sm font-semibold text-slate-900">Estimated Price</span>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" value={`Rp ${(quantity * (selectedMaterial?.purchasePrice ?? 0)).toLocaleString("id-ID")}`} readOnly />
            </label>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Quantity</span>
              <input type="number" min={1} className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </label>
            <label className="mb-[14px] space-y-1">
              <span className="text-sm font-semibold text-slate-900">Supplier</span>
              <input className="tap-target w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" value={supplier} onChange={(event) => setSupplier(event.target.value)} />
            </label>
            <label className="mb-[14px] md:col-span-2">
              <span className="mb-[6px] block text-sm font-semibold text-slate-900">Description</span>
              <textarea rows={4} className="block min-h-[90px] w-full resize-y rounded-lg border border-[#d1d5db] bg-white px-[10px] py-[10px] text-sm text-slate-900" placeholder="Contoh: Catatan tambahan mengenai kondisi material atau transaksi gudang." value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            <div className="md:col-span-2">
              <Button type="button" className="px-4 py-2 text-sm" onClick={() => void onSubmit()}>
                <span className="inline-flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Submit Purchase Request
                </span>
              </Button>
            </div>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
        </Card>
      ) : null}

      <Card title="Daftar Purchase Request">
        <Table
          data={purchaseRequests}
          emptyText="Belum ada purchase request."
          enableSearch={false}
          columns={[
            { header: "Material", key: "material", render: (row) => row.materialName },
            { header: "Branch", key: "branch", render: (row) => row.branchName },
            { header: "Qty", key: "qty", render: (row) => row.quantity },
            { header: "Estimated", key: "estimated", render: (row) => `Rp ${row.estimatedPrice.toLocaleString("id-ID")}` },
            { header: "Supplier", key: "supplier", render: (row) => row.supplier ?? "-" },
            { header: "Status", key: "status", render: (row) => <Badge tone={statusTone(row.status)}>{row.status.toUpperCase()}</Badge> },
            {
              header: "Actions",
              key: "actions",
              render: (row) => (
                <div className="flex gap-2">
                  <IconActionButton icon={<Eye className="h-4 w-4" />} label="View Purchase Request" onClick={() => setSelectedRequest(row)} />
                  {isManager ? (
                    <>
                      <IconActionButton icon={<Check className="h-4 w-4" />} label="Approve Purchase Request" onClick={() => void onApprove(row.id)} disabled={row.status !== "pending"} />
                      <IconActionButton icon={<Ban className="h-4 w-4" />} label="Reject Purchase Request" tone="danger" onClick={() => void onReject(row.id)} disabled={row.status !== "pending"} />
                    </>
                  ) : null}
                  {isWarehouse ? (
                    <IconActionButton icon={<RotateCcw className="h-4 w-4" />} label="Resend Purchase Request" onClick={() => void onResend(row.id)} disabled={row.status !== "rejected"} />
                  ) : null}
                </div>
              )
            }
          ]}
        />
        {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      </Card>

      {selectedRequest ? (
        <Card title="Detail Purchase Request">
          <div className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Material</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedRequest.materialName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedRequest.branchName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requester</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedRequest.requestedByName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <Badge tone={statusTone(selectedRequest.status)}>{selectedRequest.status.toUpperCase()}</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedRequest.quantity}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Price</p>
              <p className="mt-1 text-sm font-medium text-slate-900">Rp {selectedRequest.estimatedPrice.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{selectedRequest.supplier ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created At</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{new Date(selectedRequest.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {selectedRequest.notes?.trim() ? selectedRequest.notes : "-"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

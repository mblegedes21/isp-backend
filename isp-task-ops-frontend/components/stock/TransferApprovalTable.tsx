"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SmartSearch } from "@/components/search/SmartSearch";
import { fuzzySearch } from "@/lib/search/fuzzySearch";
import { Button } from "@/components/ui/Button";
import { useStockStore } from "@/store/useStockStore";

export function TransferApprovalTable() {
  const transfers = useStockStore((state) => state.transfers);
  const approveTransfer = useStockStore((state) => state.approveTransfer);
  const [query, setQuery] = useState("");

  const filteredTransfers = useMemo(
    () => fuzzySearch(transfers, query, ["id", "fromBranch", "toBranch", "status"]),
    [transfers, query]
  );

  return (
    <Card title="Transfer Approve" className="overflow-auto">
      <div className="space-y-3">
        <SmartSearch value={query} onChange={setQuery} placeholder="Cari data..." />

        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-2 py-2">Request</th>
              <th className="px-2 py-2">From</th>
              <th className="px-2 py-2">To</th>
              <th className="px-2 py-2">Qty</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="border-b border-gray-100">
                  <td className="px-2 py-2">{transfer.id}</td>
                  <td className="px-2 py-2">{transfer.fromBranch}</td>
                  <td className="px-2 py-2">{transfer.toBranch}</td>
                  <td className="px-2 py-2">{transfer.quantity}</td>
                  <td className="px-2 py-2">{transfer.status}</td>
                  <td className="px-2 py-2">
                    <Button
                      variant="secondary"
                      onClick={() => void approveTransfer(transfer.id)}
                      disabled={transfer.status !== "PENDING"}
                    >
                      Approve
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-center text-gray-500" colSpan={6}>Data tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

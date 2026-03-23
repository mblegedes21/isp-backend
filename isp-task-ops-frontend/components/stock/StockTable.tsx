"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SmartSearch } from "@/components/search/SmartSearch";
import { fuzzySearch } from "@/lib/search/fuzzySearch";
import { useStockStore } from "@/store/useStockStore";

export function StockTable() {
  const items = useStockStore((state) => state.items);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(
    () => fuzzySearch(items, query, ["name", "sku", "barcode", "branch"]),
    [items, query]
  );

  return (
    <Card title="Stock Overview">
      <div className="space-y-3">
        <SmartSearch value={query} onChange={setQuery} placeholder="Cari data..." />

        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-2 py-2">SKU</th>
              <th className="px-2 py-2">Item</th>
              <th className="px-2 py-2">Branch</th>
              <th className="px-2 py-2">Qty</th>
              <th className="px-2 py-2">Minimum</th>
              <th className="px-2 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="break-words px-2 py-2 font-semibold">{item.sku}</td>
                  <td className="break-words px-2 py-2">{item.name}</td>
                  <td className="break-words px-2 py-2">{item.branch}</td>
                  <td className="px-2 py-2">{item.quantity}</td>
                  <td className="px-2 py-2">{item.minimum}</td>
                  <td className={`px-2 py-2 font-semibold ${item.quantity <= item.minimum ? "text-danger" : "text-success"}`}>
                    {item.quantity - item.minimum}
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

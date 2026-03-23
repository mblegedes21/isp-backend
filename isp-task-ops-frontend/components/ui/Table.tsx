"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SmartSearch } from "@/components/search/SmartSearch";
import { fuzzySearch } from "@/lib/search/fuzzySearch";

interface TableColumn<T> {
  header: string;
  key: string;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyText?: string;
  searchableKeys?: string[];
  searchPlaceholder?: string;
  enableSearch?: boolean;
}

function inferSearchableKeys<T>(rows: T[]): string[] {
  if (rows.length === 0) return [];

  const sample = rows[0] as unknown as Record<string, unknown>;

  return Object.keys(sample).filter((key) => {
    const value = sample[key];
    const valueType = typeof value;
    return valueType === "string" || valueType === "number" || valueType === "boolean";
  });
}

export function Table<T>({
  columns,
  data,
  emptyText = "Data tidak tersedia.",
  searchableKeys,
  searchPlaceholder = "Cari data...",
  enableSearch = true
}: TableProps<T>) {
  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!enableSearch) return data;
    const keys = searchableKeys ?? inferSearchableKeys(data);
    return fuzzySearch(data, query, keys);
  }, [data, enableSearch, query, searchableKeys]);

  const resolvedEmptyText = query.trim() ? "Data tidak ditemukan." : emptyText;

  return (
    <div className="space-y-3">
      {enableSearch ? <SmartSearch value={query} onChange={setQuery} placeholder={searchPlaceholder} /> : null}

      <div className="overflow-x-auto rounded-2xl border border-app-border bg-white/85 shadow-sm">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-app-border bg-sky-50/80 text-left text-slate-600">
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-2.5 font-semibold ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index} className="border-b border-sky-100/80 transition hover:bg-sky-50/50">
                  {columns.map((column) => (
                    <td key={`${column.key}-${index}`} className={`overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 align-top ${column.className ?? ""}`}>
                      {column.render(row, index)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500" colSpan={columns.length}>
                  {resolvedEmptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export interface ManagementTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  headerClassName?: string;
  cellClassName?: string;
}

interface ManagementTableProps<T> {
  data: T[];
  columns: ManagementTableColumn<T>[];
  rowKey: (row: T, index: number) => string;
  emptyText: string;
  searchPlaceholder?: string;
  searchableText?: (row: T) => string;
  controls?: ReactNode;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

type SortDirection = "asc" | "desc";

export function ManagementTable<T>({
  data,
  columns,
  rowKey,
  emptyText,
  searchPlaceholder,
  searchableText,
  controls,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100]
}: ManagementTableProps<T>) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredRows = useMemo(() => {
    if (!searchableText || !search.trim()) return data;
    const query = search.trim().toLowerCase();
    return data.filter((row) => searchableText(row).toLowerCase().includes(query));
  }, [data, search, searchableText]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((item) => item.key === sortKey);
    if (!column?.sortValue) return filteredRows;

    return [...filteredRows].sort((left, right) => {
      const leftValue = column.sortValue?.(left);
      const rightValue = column.sortValue?.(right);

      if (leftValue === undefined || rightValue === undefined) return 0;
      if (leftValue === rightValue) return 0;

      const result = leftValue > rightValue ? 1 : -1;
      return sortDirection === "asc" ? result : -result;
    });
  }, [columns, filteredRows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, search]);

  const pagedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, sortedRows]);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    const pages: number[] = [];
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);

  const onToggleSort = (key: string, sortable: boolean) => {
    if (!sortable) return;
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          {searchableText ? (
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder ?? "Cari data"}
              className="w-full rounded-xl border border-app-border bg-white/90 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 md:max-w-sm"
            />
          ) : null}
          {controls}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-xl border border-app-border bg-white/90 px-3 py-2 text-sm text-slate-700"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-app-border bg-white/90 shadow-sm">
        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full table-fixed text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-sky-50/95 backdrop-blur-sm">
              <tr className="border-b border-app-border text-left text-slate-600">
                {columns.map((column) => {
                  const sortable = Boolean(column.sortValue);
                  const isSorted = sortKey === column.key;
                  return (
                    <th key={column.key} className={`px-3 py-3 font-semibold ${column.headerClassName ?? ""}`}>
                      <button
                        type="button"
                        onClick={() => onToggleSort(column.key, sortable)}
                        className={`flex items-center gap-1 text-left ${sortable ? "transition hover:text-primary" : "cursor-default"}`}
                      >
                        <span>{column.header}</span>
                        {sortable ? <span className="text-[10px] uppercase">{isSorted ? sortDirection : "sort"}</span> : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/80 bg-white/90">
              {pagedRows.length > 0 ? (
                pagedRows.map((row, index) => (
                  <tr key={rowKey(row, index)} className="align-top transition hover:bg-sky-50/50">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-3 py-3 align-top text-slate-700 break-words ${column.cellClassName ?? ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-500">
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">
          Menampilkan {pagedRows.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, sortedRows.length)} dari {sortedRows.length} data
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-xl border border-app-border px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${page === pageNumber ? "bg-primary text-white shadow-sm shadow-primary/25" : "border border-app-border text-slate-700 hover:bg-sky-50"}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-app-border px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

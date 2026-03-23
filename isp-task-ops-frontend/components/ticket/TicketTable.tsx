"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTicketStore } from "@/store/useTicketStore";
import { Card } from "@/components/ui/Card";
import { SmartSearch } from "@/components/search/SmartSearch";
import { fuzzySearch } from "@/lib/search/fuzzySearch";
import { TicketStatusBadge } from "@/components/ticket/TicketStatusBadge";

export function TicketTable() {
  const tickets = useTicketStore((state) => state.tickets);
  const [query, setQuery] = useState("");

  const filteredTickets = useMemo(
    () => fuzzySearch(tickets, query, ["id", "problemType", "branch", "title", "assignee"]),
    [tickets, query]
  );

  return (
    <Card title="Ticket List" className="overflow-auto">
      <div className="space-y-3">
        <SmartSearch value={query} onChange={setQuery} placeholder="Cari data..." />

        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-2 py-2">ID</th>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Branch</th>
              <th className="px-2 py-2">Assignee</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Loss %</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100">
                  <td className="px-2 py-2 font-semibold">{ticket.id}</td>
                  <td className="px-2 py-2">{ticket.title}</td>
                  <td className="px-2 py-2">{ticket.branch}</td>
                  <td className="px-2 py-2">{ticket.assignee}</td>
                  <td className="px-2 py-2"><TicketStatusBadge status={ticket.status} /></td>
                  <td className="px-2 py-2">
                    <span className={ticket.estimatedLossPercent > 5 ? "font-bold text-danger" : "text-gray-700"}>
                      {ticket.estimatedLossPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <Link className="font-semibold text-accent underline" href={`/dashboard/noc/tickets/${ticket.id}`}>
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-2 py-4 text-center text-gray-500" colSpan={7}>Data tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

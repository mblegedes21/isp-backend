"use client";

import { Card } from "@/components/ui/Card";

interface ActivityItem {
  id: string;
  message: string;
  timeLabel: string;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <Card title="Aktivitas Terbaru">
      {items.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-gray-200 p-3">
              <p className="font-semibold text-ink">{item.message}</p>
              <p className="mt-1 text-xs text-gray-500">{item.timeLabel}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Belum ada aktivitas terbaru.</p>
      )}
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ManagerActionItem } from "@/types/operations";

interface ManagerActionCenterProps {
  items: ManagerActionItem[];
  onSelect: (sectionId: string) => void;
}

const severityClass: Record<ManagerActionItem["severity"], string> = {
  INFO: "border-sky-200 bg-sky-50 text-sky-800",
  PERINGATAN: "border-amber-200 bg-amber-50 text-amber-800",
  KRITIS: "border-red-200 bg-red-50 text-red-800"
};

export function ManagerActionCenter({ items, onSelect }: ManagerActionCenterProps) {
  return (
    <Card title="Manager Action Center">
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className={`rounded-lg border p-4 ${severityClass[item.severity]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide">{item.title}</h3>
                  <p className="mt-1 text-sm">{item.description}</p>
                </div>
                <Button variant="secondary" className="px-3 py-2 text-sm" onClick={() => onSelect(item.targetSection)}>
                  {item.ctaLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Belum ada tindakan mendesak saat ini.</p>
      )}
    </Card>
  );
}

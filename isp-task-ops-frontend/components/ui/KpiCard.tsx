import { Card } from "@/components/ui/Card";

interface KpiCardProps {
  title: string;
  value: string | number;
}

export function KpiCard({ title, value }: KpiCardProps) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-600">{subtitle}</p> : null}
    </Card>
  );
}

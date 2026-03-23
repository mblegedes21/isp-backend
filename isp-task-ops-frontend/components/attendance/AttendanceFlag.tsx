import { Badge } from "@/components/ui/Badge";

interface AttendanceFlagProps {
  flagged: boolean;
}

export function AttendanceFlag({ flagged }: AttendanceFlagProps) {
  return flagged ? <Badge tone="warning">Bermasalah</Badge> : <Badge tone="success">Normal</Badge>;
}

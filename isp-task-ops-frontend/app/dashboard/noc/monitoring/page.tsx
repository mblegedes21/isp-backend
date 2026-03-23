"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { apiClient, buildActorHeaders, extractApiMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function NocMonitoringPage() {
  const user = useAuthStore((state) => state.user);
  const [monitoring, setMonitoring] = useState<{ status: string; active_nodes: number; down_nodes: number; alerts: Array<{ id: string; area: string; severity: string; ticket_count: number; escalation_count: number; status: string }> }>({
    status: "online",
    active_nodes: 0,
    down_nodes: 0,
    alerts: []
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadMonitoring = async () => {
      try {
        setMessage("");
        const { data } = await apiClient.get("/network/monitoring", {
          headers: buildActorHeaders(user)
        });
        setMonitoring(data.data ?? data);
      } catch (error) {
        setMessage(extractApiMessage(error, "Data monitoring gagal dimuat."));
      }
    };

    void loadMonitoring();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Monitoring</h1>
      {message ? <p className="text-sm text-danger">{message}</p> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard title="Network Status" value={monitoring.status} />
        <StatCard title="Active Nodes" value={monitoring.active_nodes} />
        <StatCard title="Down Nodes" value={monitoring.down_nodes} />
      </div>
      <Card title="Monitoring Operasional Area">
        <Table
          data={monitoring.alerts}
          emptyText="Tidak ada alert jaringan."
          columns={[
            { header: "Area", key: "area", render: (row) => <span className="font-semibold">{row.area}</span> },
            { header: "Severity", key: "severity", render: (row) => row.severity },
            { header: "Tickets", key: "ticket_count", render: (row) => row.ticket_count },
            { header: "Escalations", key: "escalation_count", render: (row) => row.escalation_count },
            { header: "Status", key: "status", render: (row) => row.status },
          ]}
        />
      </Card>
    </div>
  );
}

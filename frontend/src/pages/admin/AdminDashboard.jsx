import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader } from "../../components/UI";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/admin").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Operations overview" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active shipments" value={stats.activeShipments} tone="orange" />
        <StatCard label="Awaiting assignment" value={stats.pendingAssignment} tone={stats.pendingAssignment > 0 ? "bad" : "good"} />
        <StatCard label="Delivered today" value={stats.deliveredToday} tone="good" />
        <StatCard label="Available vehicles" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} />
        <StatCard label="Available drivers" value={`${stats.availableDrivers} / ${stats.totalDrivers}`} />
        <StatCard label="Warehouses" value={stats.warehouseCount} />
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Shipments by status</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(stats.statusMap).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm">
              <span className="capitalize">{status.replace("_", " ")}</span>
              <span className="font-mono text-[var(--color-text-dim)]">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

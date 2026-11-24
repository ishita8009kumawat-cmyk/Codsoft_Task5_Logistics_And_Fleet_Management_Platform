import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader } from "../../components/UI";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/customer").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Customer" title="Your shipments" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active shipments" value={stats.activeShipments} tone="orange" />
        <StatCard label="Total shipments" value={stats.totalShipments} />
        <StatCard label="Delivered" value={stats.deliveredShipments} tone="good" />
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Need to ship something?</h3>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">Book a new shipment and we'll assign a driver right away.</p>
        <Link to="/book" className="btn btn-orange mt-4 inline-flex">
          Book a shipment
        </Link>
      </div>
    </div>
  );
}

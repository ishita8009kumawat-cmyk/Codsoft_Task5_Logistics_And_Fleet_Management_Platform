import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp } from "../../components/UI";

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/drivers").then((res) => {
      setDrivers(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Admin · Fleet" title="Drivers" />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : drivers.length === 0 ? (
        <EmptyState text="No drivers yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Active shipments</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{d.name}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">{d.email} · {d.phone}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{d.license_no || "—"}</td>
                  <td className="px-4 py-3">{d.plate_no ? `${d.plate_no} (${d.vehicle_type})` : "Unassigned"}</td>
                  <td className="px-4 py-3">{d.active_shipments}</td>
                  <td className="px-4 py-3">
                    <Stamp status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

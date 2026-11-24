import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp, Timeline } from "../../components/UI";

const NEXT_STATUS = {
  assigned: { next: "picked_up", label: "Mark picked up" },
  picked_up: { next: "in_transit", label: "Mark in transit" },
  in_transit: { next: "delivered", label: "Mark delivered" },
};

export default function MyDeliveries() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/shipments/assigned");
    setShipments(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  async function advance(shipment) {
    const step = NEXT_STATUS[shipment.status];
    if (!step) return;
    await api.put(`/shipments/${shipment.id}/status`, { status: step.next });
    load();
  }

  const active = shipments.filter((s) => !["delivered", "cancelled"].includes(s.status));
  const history = shipments.filter((s) => ["delivered", "cancelled"].includes(s.status));

  return (
    <div>
      <PageHeader eyebrow="Driver" title="My deliveries" />

      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">Active</h3>
      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : active.length === 0 ? (
        <EmptyState text="No active deliveries assigned to you right now." />
      ) : (
        <div className="space-y-4">
          {active.map((s) => {
            const step = NEXT_STATUS[s.status];
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-text-dim)]">Shipment #{s.id}</p>
                    <p className="font-semibold text-[var(--color-ink)]">{s.destination_address}</p>
                    <p className="text-xs text-[var(--color-text-dim)]">
                      {s.customer_name} · {s.customer_phone}
                    </p>
                    {s.warehouse_name && (
                      <p className="text-xs text-[var(--color-text-dim)]">
                        Pickup: {s.warehouse_name} ({s.warehouse_address})
                      </p>
                    )}
                    {s.description && <p className="mt-1 text-xs text-[var(--color-text-dim)]">{s.description} · {s.weight_kg} kg</p>}
                  </div>
                  <Stamp status={s.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {step && (
                    <button className="btn btn-orange px-3 py-1.5 text-xs" onClick={() => advance(s)}>
                      {step.label}
                    </button>
                  )}
                  <button className="btn btn-outline px-3 py-1.5 text-xs" onClick={() => setExpanded(isOpen ? null : s.id)}>
                    {isOpen ? "Hide history" : "View history"}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 border-t border-[var(--color-line)] pt-4">
                    <Timeline events={s.events} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <>
          <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">History</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
                <tr>
                  <th className="px-4 py-3">Shipment</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3 font-mono text-xs">#{s.id}</td>
                    <td className="px-4 py-3">{s.destination_address}</td>
                    <td className="px-4 py-3">
                      <Stamp status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

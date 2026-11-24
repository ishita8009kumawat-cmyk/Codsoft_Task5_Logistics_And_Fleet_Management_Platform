import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, EmptyState, Stamp, Timeline } from "../../components/UI";

export default function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/shipments/mine");
    setShipments(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Customer" title="My shipments" />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : shipments.length === 0 ? (
        <EmptyState text="You haven't booked any shipments yet." />
      ) : (
        <div className="space-y-4">
          {shipments.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-[var(--color-text-dim)]">Shipment #{s.id} · {s.created_at}</p>
                    <p className="font-semibold text-[var(--color-ink)]">{s.destination_address}</p>
                    {s.description && <p className="text-xs text-[var(--color-text-dim)]">{s.description} · {s.weight_kg} kg</p>}
                    <p className="mt-1 text-xs text-[var(--color-text-dim)]">
                      {s.warehouse_name ? `From ${s.warehouse_name}` : ""}
                      {s.driver_name ? ` · Driver: ${s.driver_name}` : ""}
                      {s.plate_no ? ` (${s.plate_no})` : ""}
                    </p>
                  </div>
                  <Stamp status={s.status} />
                </div>

                <button className="btn btn-outline mt-3 px-3 py-1.5 text-xs" onClick={() => setExpanded(isOpen ? null : s.id)}>
                  {isOpen ? "Hide tracking" : "Track shipment"}
                </button>

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
    </div>
  );
}

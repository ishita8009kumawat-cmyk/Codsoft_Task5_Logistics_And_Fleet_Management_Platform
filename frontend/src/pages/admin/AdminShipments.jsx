import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, Stamp, Timeline } from "../../components/UI";

export default function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailShipment, setDetailShipment] = useState(null);

  async function load() {
    setLoading(true);
    const [s, d, v] = await Promise.all([api.get("/shipments"), api.get("/drivers"), api.get("/vehicles")]);
    setShipments(s.data);
    setDrivers(d.data);
    setVehicles(v.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAssign(shipment) {
    setAssignTarget(shipment);
    setDriverId(shipment.driver_id || "");
    setVehicleId(shipment.vehicle_id || "");
    setError("");
    setAssignOpen(true);
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/shipments/${assignTarget.id}/assign`, { driver_id: Number(driverId), vehicle_id: vehicleId ? Number(vehicleId) : null });
      setAssignOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  function openDetail(shipment) {
    setDetailShipment(shipment);
    setDetailOpen(true);
  }

  const filtered = filter === "all" ? shipments : shipments.filter((s) => s.status === filter);
  const availableDrivers = drivers.filter((d) => d.status !== "off_duty" || String(d.id) === String(driverId));

  return (
    <div>
      <PageHeader eyebrow="Admin · Dispatch" title="Shipments" />

      <div className="mb-4 flex flex-wrap gap-2">
        {["all", "pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`stamp ${filter === f ? "stamp-info" : "opacity-40"}`} type="button">
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState text="No shipments match this filter." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-paper-dim)] text-left text-xs uppercase tracking-wide text-[var(--color-text-dim)]">
              <tr>
                <th className="px-4 py-3">Shipment</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Driver / Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-line)]">
                  <td className="px-4 py-3 font-mono text-xs">#{s.id}</td>
                  <td className="px-4 py-3">{s.customer_name}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate" title={s.destination_address}>
                    {s.destination_address}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-dim)]">
                    {s.driver_name || "Unassigned"}
                    {s.plate_no && ` · ${s.plate_no}`}
                  </td>
                  <td className="px-4 py-3">
                    <Stamp status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button className="btn btn-outline px-3 py-1 text-xs" onClick={() => openDetail(s)}>
                      Track
                    </button>
                    {(s.status === "pending" || s.status === "assigned") && (
                      <button className="btn btn-orange px-3 py-1 text-xs" onClick={() => openAssign(s)}>
                        {s.status === "pending" ? "Assign" : "Reassign"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign shipment #${assignTarget?.id ?? ""}`}>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="label">Driver</label>
            <select className="input" required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select driver</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Vehicle (optional)</label>
            <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">No vehicle yet</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_no} · {v.type} ({v.status})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm assignment
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Shipment #${detailShipment?.id ?? ""}`} wide>
        {detailShipment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="label">Customer</p>
                <p>{detailShipment.customer_name}</p>
              </div>
              <div>
                <p className="label">Destination</p>
                <p>{detailShipment.destination_address}</p>
              </div>
              <div>
                <p className="label">Driver</p>
                <p>{detailShipment.driver_name || "Unassigned"}</p>
              </div>
              <div>
                <p className="label">Vehicle</p>
                <p>{detailShipment.plate_no || "—"}</p>
              </div>
            </div>
            <div>
              <p className="label mb-2">Tracking history</p>
              <Timeline events={detailShipment.events} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

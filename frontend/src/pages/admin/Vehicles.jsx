import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState, Stamp } from "../../components/UI";

const emptyForm = { plate_no: "", type: "van", capacity_kg: "", driver_id: "" };
const STATUSES = ["available", "in_transit", "maintenance"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [v, d] = await Promise.all([api.get("/vehicles"), api.get("/drivers")]);
    setVehicles(v.data);
    setDrivers(d.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/vehicles", {
        ...form,
        capacity_kg: Number(form.capacity_kg) || 500,
        driver_id: form.driver_id || null,
      });
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function setStatus(vehicle, status) {
    await api.put(`/vehicles/${vehicle.id}`, { status });
    load();
  }

  async function handleDelete(vehicle) {
    if (!confirm(`Remove vehicle ${vehicle.plate_no}?`)) return;
    await api.delete(`/vehicles/${vehicle.id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Fleet"
        title="Vehicles"
        action={
          <button className="btn btn-orange" onClick={openAdd}>
            + Add vehicle
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : vehicles.length === 0 ? (
        <EmptyState text="No vehicles registered yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between">
                <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  {v.plate_no}
                </p>
                <Stamp status={v.status} />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-dim)]">
                {v.type} · {v.capacity_kg} kg capacity
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-dim)]">Driver: {v.driver_name || "Unassigned"}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(v, s)}
                    className={`stamp ${v.status === s ? "" : "opacity-35"} ${
                      s === "available" ? "stamp-good" : s === "maintenance" ? "stamp-bad" : "stamp-warn"
                    }`}
                    type="button"
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>

              <button className="btn btn-danger mt-3 w-full px-2 py-1 text-xs" onClick={() => handleDelete(v)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add vehicle">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Plate number</label>
            <input
              className="input"
              required
              placeholder="e.g. KA-01-XY-9999"
              value={form.plate_no}
              onChange={(e) => setForm({ ...form, plate_no: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="bike">Bike</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
              </select>
            </div>
            <div>
              <label className="label">Capacity (kg)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.capacity_kg}
                onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Assign driver (optional)</label>
            <select className="input" value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add vehicle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

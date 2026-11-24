import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader, Modal, EmptyState } from "../../components/UI";

const emptyForm = { name: "", address: "", city: "" };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get("/warehouses");
    setWarehouses(res.data);
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
      await api.post("/warehouses", form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleDelete(w) {
    if (!confirm(`Delete warehouse "${w.name}"?`)) return;
    await api.delete(`/warehouses/${w.id}`);
    load();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin · Network"
        title="Warehouses"
        action={
          <button className="btn btn-orange" onClick={openAdd}>
            + Add warehouse
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--color-text-dim)]">Loading…</p>
      ) : warehouses.length === 0 ? (
        <EmptyState text="No warehouses yet." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className="card p-5">
              <p className="font-semibold text-[var(--color-ink)]">{w.name}</p>
              <p className="mt-1 text-xs text-[var(--color-text-dim)]">{w.address}</p>
              <p className="text-xs text-[var(--color-text-dim)]">{w.city}</p>
              <p className="mt-2 text-xs">
                <span className="font-mono text-[var(--color-orange)]">{w.active_shipments}</span> active shipment
                {w.active_shipments === 1 ? "" : "s"}
              </p>
              <button className="btn btn-danger mt-3 w-full px-2 py-1 text-xs" onClick={() => handleDelete(w)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add warehouse">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">City</label>
            <input className="input" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add warehouse
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

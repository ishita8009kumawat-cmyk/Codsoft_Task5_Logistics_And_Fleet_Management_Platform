import { useEffect, useState } from "react";
import api from "../../api";
import { PageHeader } from "../../components/UI";
import { useNavigate } from "react-router-dom";

const emptyForm = { warehouse_id: "", destination_address: "", description: "", weight_kg: "" };

export default function BookShipment() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/warehouses").then((res) => setWarehouses(res.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/shipments", { ...form, weight_kg: Number(form.weight_kg) || 1 });
      navigate("/shipments");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Customer" title="Book a shipment" />
      <div className="card max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Pickup warehouse</label>
            <select
              className="input"
              required
              value={form.warehouse_id}
              onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
            >
              <option value="">Select a warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Destination address</label>
            <textarea
              className="input"
              rows={2}
              required
              value={form.destination_address}
              onChange={(e) => setForm({ ...form, destination_address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">What are you shipping?</label>
            <input
              className="input"
              placeholder="e.g. 2 boxes of books"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              required
              value={form.weight_kg}
              onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-[var(--color-bad)]">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-orange">
            {submitting ? "Booking…" : "Book shipment"}
          </button>
        </form>
      </div>
    </div>
  );
}

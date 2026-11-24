import { useEffect, useState } from "react";
import api from "../../api";
import { StatCard, PageHeader, Stamp } from "../../components/UI";

const STATUSES = ["available", "on_delivery", "off_duty"];

export default function DriverDashboard() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);

  async function load() {
    const [d, p] = await Promise.all([api.get("/dashboard/driver"), api.get("/drivers/me")]);
    setStats(d.data);
    setProfile(p.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(status) {
    await api.put("/drivers/me/status", { status });
    load();
  }

  if (!stats || !profile) return <p className="text-sm text-[var(--color-text-dim)]">Loading overview…</p>;

  return (
    <div>
      <PageHeader eyebrow="Driver" title="Your overview" />

      <div className="mb-6 card p-5">
        <p className="label mb-2">Your availability</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`stamp ${profile.status === s ? "" : "opacity-35"} ${
                s === "available" ? "stamp-good" : s === "off_duty" ? "stamp-bad" : "stamp-warn"
              }`}
              type="button"
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        {profile.vehicle && (
          <p className="mt-3 text-xs text-[var(--color-text-dim)]">
            Assigned vehicle: <span className="font-mono">{profile.vehicle.plate_no}</span> ({profile.vehicle.type})
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active deliveries" value={stats.activeShipments} tone="orange" />
        <StatCard label="Delivered today" value={stats.deliveredToday} tone="good" />
        <StatCard label="Delivered all-time" value={stats.deliveredTotal} />
      </div>
    </div>
  );
}

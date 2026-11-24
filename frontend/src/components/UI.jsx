export function StatCard({ label, value, sublabel, tone = "default" }) {
  const toneColor =
    tone === "good" ? "var(--color-good)" : tone === "bad" ? "var(--color-bad)" : tone === "orange" ? "var(--color-orange)" : "var(--color-ink)";
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)", color: toneColor }}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-[var(--color-text-dim)]">{sublabel}</p>}
    </div>
  );
}

const STATUS_MAP = {
  pending: "stamp-info",
  assigned: "stamp-warn",
  picked_up: "stamp-warn",
  in_transit: "stamp-warn",
  delivered: "stamp-good",
  cancelled: "stamp-bad",
  available: "stamp-good",
  in_transit_vehicle: "stamp-warn",
  maintenance: "stamp-bad",
  on_delivery: "stamp-warn",
  off_duty: "stamp-bad",
};

export function Stamp({ status }) {
  const cls = STATUS_MAP[status] || "stamp-info";
  return <span className={`stamp ${cls}`}>{(status || "—").replace("_", " ")}</span>;
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`card w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-[var(--color-ink)] text-lg leading-none">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="p-10 text-center text-sm text-[var(--color-text-dim)]">{text}</div>;
}

export function PageHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line)] pb-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-orange)]">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Timeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-[var(--color-text-dim)]">No tracking history yet.</p>;
  }
  return (
    <ol className="space-y-4 border-l-2 border-[var(--color-line)] pl-4">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-orange)]" />
          <div className="flex items-center gap-2">
            <Stamp status={e.status} />
            <span className="text-xs text-[var(--color-text-dim)]">{e.created_at}</span>
          </div>
          {e.note && <p className="mt-1 text-sm text-[var(--color-text)]">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}

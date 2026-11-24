import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const NAV = {
  admin: [
    { to: "/", label: "Overview", end: true },
    { to: "/shipments", label: "Shipments" },
    { to: "/drivers", label: "Drivers" },
    { to: "/vehicles", label: "Vehicles" },
    { to: "/warehouses", label: "Warehouses" },
  ],
  driver: [
    { to: "/", label: "Overview", end: true },
    { to: "/deliveries", label: "My deliveries" },
  ],
  customer: [
    { to: "/", label: "Overview", end: true },
    { to: "/shipments", label: "My shipments" },
    { to: "/book", label: "Book a shipment" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-paper)]">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-[var(--color-ink)] text-white">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-orange-light)]">CodSoft Task 5</p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            FleetFlow
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-[var(--color-orange-light)]" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs capitalize text-white/50">{user.role}</p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 w-full rounded-lg border border-white/15 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

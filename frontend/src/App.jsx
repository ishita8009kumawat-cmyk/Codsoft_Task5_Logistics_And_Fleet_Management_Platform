import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminShipments from "./pages/admin/AdminShipments";
import Drivers from "./pages/admin/Drivers";
import Vehicles from "./pages/admin/Vehicles";
import Warehouses from "./pages/admin/Warehouses";

import DriverDashboard from "./pages/driver/DriverDashboard";
import MyDeliveries from "./pages/driver/MyDeliveries";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import BookShipment from "./pages/customer/BookShipment";
import MyShipments from "./pages/customer/MyShipments";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoutes() {
  const { user } = useAuth();

  if (user.role === "admin") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="shipments" element={<AdminShipments />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="warehouses" element={<Warehouses />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user.role === "driver") {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DriverDashboard />} />
          <Route path="deliveries" element={<MyDeliveries />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // customer
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CustomerDashboard />} />
        <Route path="shipments" element={<MyShipments />} />
        <Route path="book" element={<BookShipment />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <RoleRoutes />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

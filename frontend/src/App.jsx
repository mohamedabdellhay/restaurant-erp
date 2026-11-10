import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@context/AuthContext";
import { ThemeProvider } from "@context/ThemeContext";
import ProtectedRoute from "@components/ProtectedRoute";
import RoleProtectedRoute from "@components/RoleProtectedRoute";
import DynamicFavicon from "@components/DynamicFavicon";
import Login from "@pages/Login/Login";
import Profile from "@pages/Profile/Profile";
import Staff from "@pages/Staff/Staff";
import Departments from "@pages/Departments/Departments";
import Suppliers from "@pages/Suppliers/Suppliers";
import Inventory from "@pages/Inventory/Inventory";
import PaymentResult from "@pages/PaymentResult/PaymentResult";
import DashboardLayout from "@layouts/DashboardLayout";
import LandingPage from "@pages/LandingPage/LandingPage";
import Tables from "@pages/Tables/Tables";
import Reservations from "@pages/Reservations/Reservations";
import Orders from "@pages/Orders/Orders";
import Settings from "@pages/Settings/Settings";
import Invoices from "@pages/Invoices/Invoices";
import Dashboard from "@pages/Dashboard/Dashboard";
import Menu from "@pages/Menu/Menu";
import Reports from "@pages/Reports/Reports";
import Roles from "@pages/Roles/Roles";
function App() {
  return (
    <ThemeProvider>
      <DynamicFavicon />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/payment/*" element={<PaymentResult />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                {/* Dashboard - view_dashboard permission */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute permission="view_dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Profile - Any logged-in staff */}
                <Route path="/profile" element={<Profile />} />

                {/* Orders - view_orders permission */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute permission="view_orders">
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                {/* Menu - view_menu permission */}
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute permission="view_menu">
                      <Menu />
                    </ProtectedRoute>
                  }
                />

                {/* Tables - view_tables permission */}
                <Route
                  path="/tables"
                  element={
                    <ProtectedRoute permission="view_tables">
                      <Tables />
                    </ProtectedRoute>
                  }
                />

                {/* Reservations - view_reservations permission */}
                <Route
                  path="/reservations"
                  element={
                    <ProtectedRoute permission="view_reservations">
                      <Reservations />
                    </ProtectedRoute>
                  }
                />

                {/* Staff - view_staff permission */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute permission="view_staff">
                      <Staff />
                    </ProtectedRoute>
                  }
                />

                {/* Departments - view_departments permission */}
                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute permission="view_departments">
                      <Departments />
                    </ProtectedRoute>
                  }
                />

                {/* Suppliers - view_suppliers permission */}
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute permission="view_suppliers">
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />

                {/* Inventory - view_inventory permission */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Inventory />
                    </ProtectedRoute>
                  }
                />

                {/* Invoices - view_invoices permission */}
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute permission="view_invoices">
                      <Invoices />
                    </ProtectedRoute>
                  }
                />

                {/* Reports - view_reports permission */}
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute permission="view_reports">
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute permission="manage_settings">
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Roles - view_roles permission */}
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute permission="view_roles">
                      <Roles />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

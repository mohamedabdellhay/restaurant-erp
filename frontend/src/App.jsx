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
import Waiters from "@pages/Waiters/Waiters";
import Departments from "@pages/Departments/Departments";
import Suppliers from "@pages/Suppliers/Suppliers";
import Customers from "@pages/Customers/Customers";
import CustomerDiscountGroups from "@pages/CustomerDiscountGroups/CustomerDiscountGroups";
import DiscountExclusions from "@pages/DiscountExclusions/DiscountExclusions";
import SupplierDues from "@pages/SupplierDues/SupplierDues";
import Inventory from "@pages/Inventory/Inventory";
import IngredientCategories from "@pages/IngredientCategories/IngredientCategories";
import SupportItemCategories from "@pages/SupportItemCategories/SupportItemCategories";
import SupportItems from "@pages/SupportItems/SupportItems";
import SemiFinished from "@pages/SemiFinished/SemiFinished";
import StockCount from "@pages/StockCount/StockCount";
import PurchaseReturns from "@pages/PurchaseReturns/PurchaseReturns";
import Purchase from "@pages/Purchase/Purchase";
import PurchaseOrders from "@pages/PurchaseOrders/PurchaseOrders";
import Requisitions from "@pages/Requisitions/Requisitions";
import PaymentResult from "@pages/PaymentResult/PaymentResult";
import DashboardLayout from "@layouts/DashboardLayout";
import Tables from "@pages/Tables/Tables";
import Reservations from "@pages/Reservations/Reservations";
import Orders from "@pages/Orders/Orders";
import WaitingDisplay from "@pages/WaitingDisplay/WaitingDisplay";
import AdsBoard from "@pages/AdsBoard/AdsBoard";
import Kds from "@pages/Kds/Kds";
import Settings from "@pages/Settings/Settings";
import Invoices from "@pages/Invoices/Invoices";
import BusinessClosing from "@pages/BusinessClosing/BusinessClosing";
import ProfitLoss from "@pages/ProfitLoss/ProfitLoss";
import ExpenseCategories from "@pages/ExpenseCategories/ExpenseCategories";
import Expenses from "@pages/Expenses/Expenses";
import Dashboard from "@pages/Dashboard/Dashboard";
import Menu from "@pages/Menu/Menu";
import FoodCategories from "@pages/FoodCategories/FoodCategories";
import FoodItems from "@pages/FoodItems/FoodItems";
import FoodItemForm from "@pages/FoodItems/FoodItemForm";
import Reports from "@pages/Reports/Reports";
import ItemsBySupplier from "@pages/ItemsBySupplier/ItemsBySupplier";
import SupplierTrx from "@pages/SupplierTrx/SupplierTrx";
import SupplierCredit from "@pages/SupplierCredit/SupplierCredit";
import Roles from "@pages/Roles/Roles";
import Platform from "@pages/Platform/Platform";
import { useAuth } from "@hooks/useAuth";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={user.isPlatformOwner ? "/admin/overview" : "/dashboard"}
      replace
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <DynamicFavicon />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login portal="admin" />} />
            <Route path="/payment/*" element={<PaymentResult />} />

            <Route element={<ProtectedRoute portal="admin" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                <Route path="/admin/profile" element={<Profile />} />
                <Route path="/admin/:section" element={<Platform />} />
                <Route path="/platform/*" element={<Navigate to="/admin/overview" replace />} />
              </Route>
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/waiting"
                element={
                  <ProtectedRoute permission="view_orders">
                    <WaitingDisplay />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kds"
                element={
                  <ProtectedRoute permission="view_orders">
                    <Kds />
                  </ProtectedRoute>
                }
              />
              <Route element={<DashboardLayout />}>
                {/* Dashboard - view_dashboard permission */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/dashboard/overview" replace />}
                />
                <Route
                  path="/dashboard/:section"
                  element={
                    <ProtectedRoute permission="view_dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

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
                  path="/food-categories"
                  element={
                    <ProtectedRoute permission="view_categories">
                      <FoodCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/food-items/new"
                  element={
                    <ProtectedRoute permission="manage_menu">
                      <FoodItemForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/food-items/:id/edit"
                  element={
                    <ProtectedRoute permission="manage_menu">
                      <FoodItemForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/food-items"
                  element={
                    <ProtectedRoute permission="view_menu">
                      <FoodItems />
                    </ProtectedRoute>
                  }
                />
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
                <Route
                  path="/waiters"
                  element={
                    <ProtectedRoute permission="view_staff">
                      <Waiters />
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

                {/* Suppliers share the inventory permission used by the API */}
                <Route
                  path="/suppliers"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Suppliers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/supplier-dues"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <SupplierDues />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute permission="view_customers">
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer-discount-groups"
                  element={
                    <ProtectedRoute permission="view_customers">
                      <CustomerDiscountGroups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discount-exclusions"
                  element={
                    <ProtectedRoute permission="view_customers">
                      <DiscountExclusions />
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
                <Route
                  path="/ingredient-categories"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <IngredientCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ingredient-items"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Inventory itemsOnly />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support-item-categories"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <SupportItemCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support-items"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <SupportItems />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/semi-finished"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <SemiFinished />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stock-count"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <StockCount />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchase-returns"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <PurchaseReturns />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchases"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Purchase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/purchase-orders"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <PurchaseOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requisitions"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Requisitions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requisitions/receive"
                  element={
                    <ProtectedRoute permission="view_inventory">
                      <Requisitions mode="receive" />
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
                <Route
                  path="/business-closing"
                  element={
                    <ProtectedRoute permission="view_invoices">
                      <BusinessClosing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profit-loss"
                  element={
                    <ProtectedRoute permission="view_invoices">
                      <ProfitLoss />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expense-categories"
                  element={
                    <ProtectedRoute permission="view_invoices">
                      <ExpenseCategories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <ProtectedRoute permission="view_invoices">
                      <Expenses />
                    </ProtectedRoute>
                  }
                />

                {/* Reports - view_reports permission */}
                <Route
                  path="/reports/supplier-credit"
                  element={
                    <ProtectedRoute permission="view_reports">
                      <SupplierCredit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/supplier-transactions"
                  element={
                    <ProtectedRoute permission="view_reports">
                      <SupplierTrx />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/items-by-supplier"
                  element={
                    <ProtectedRoute permission="view_reports">
                      <ItemsBySupplier />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute permission="view_reports">
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/ads-board"
                  element={
                    <ProtectedRoute permission="manage_settings">
                      <AdsBoard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={<Navigate to="/settings/general" replace />}
                />
                <Route
                  path="/settings/:section"
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

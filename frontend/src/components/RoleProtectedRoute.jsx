import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RoleProtectedRoute = ({ allowedRoles = [], requiredRole, children }) => {
  const { user, loading } = useAuth();

  // Debug logging
  console.log("RoleProtectedRoute - user:", user);
  console.log("RoleProtectedRoute - allowedRoles:", allowedRoles);
  console.log("RoleProtectedRoute - requiredRole:", requiredRole);

  if (loading) {
    console.log("RoleProtectedRoute - still loading...");
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log("RoleProtectedRoute - no user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role?.name || user.role;
  console.log("RoleProtectedRoute - userRole:", userRole);

  const rolesToCheck = requiredRole ? [requiredRole] : allowedRoles;
  console.log("RoleProtectedRoute - rolesToCheck:", rolesToCheck);

  const hasAccess =
    rolesToCheck.length > 0 &&
    rolesToCheck.some(
      (role) => role.toLowerCase() === (userRole || "").toLowerCase(),
    );

  console.log("RoleProtectedRoute - hasAccess:", hasAccess);

  if (!hasAccess) {
    console.log("RoleProtectedRoute - access denied, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("RoleProtectedRoute - access granted, rendering children");
  return children ? children : <Outlet />;
};

export default RoleProtectedRoute;

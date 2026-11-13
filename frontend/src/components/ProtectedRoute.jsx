import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";

const ProtectedRoute = ({
  permission,
  require = "any",
  fallback = null,
  children,
  portal = "restaurant",
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();

  if (loading) {
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
    return <Navigate to={portal === "admin" ? "/admin/login" : "/login"} replace />;
  }

  if (portal === "admin" && !user.isPlatformOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  if (portal !== "admin" && user.isPlatformOwner) {
    return <Navigate to="/admin/overview" replace />;
  }

  // Check permissions if specified
  if (permission) {
    let hasRequiredPermission = false;

    if (Array.isArray(permission)) {
      if (require === "all") {
        hasRequiredPermission = hasAllPermissions(permission);
      } else {
        hasRequiredPermission = hasAnyPermission(permission);
      }
    } else {
      hasRequiredPermission = hasPermission(permission);
    }

    if (!hasRequiredPermission) {
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default access denied component
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <div className="mb-4" style={{
              textAlign: "center",
              display: "grid",
              placeItems: "center",
            }}>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Role-aware ProtectedRoute.
 * allowedRole: 'super_admin' | 'center_admin'
 * Redirects to /login if not authenticated.
 * Redirects to correct dashboard if wrong role.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role — redirect to their correct dashboard
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "super_admin") return <Navigate to="/admin" replace />;
    if (user.role === "center_admin")
      return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

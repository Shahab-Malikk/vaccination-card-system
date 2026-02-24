import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute wraps routes that require authentication.
 * Checks for JWT token in localStorage.
 * Redirects to /login if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

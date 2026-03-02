import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import SuperAdminDashboard from "./pages/SuperAdminDashboard.jsx";
import CenterDashboard from "./pages/CenterDashboard.jsx";
import ViewSlip from "./pages/ViewSlip.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<ViewSlip />} />
        <Route path="/view" element={<ViewSlip />} />

        {/* SUPER ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* CENTER ADMIN */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="center_admin">
              <CenterDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

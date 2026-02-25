import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ViewSlip from "./pages/ViewSlip.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC — no auth needed */}
        <Route path="/login" element={<Login />} />
        <Route path="/view" element={<ViewSlip />} />{" "}
        {/* old — backward compat */}
        <Route path="/verify" element={<ViewSlip />} /> {/* new QR route */}
        {/* PROTECTED — requires JWT */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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

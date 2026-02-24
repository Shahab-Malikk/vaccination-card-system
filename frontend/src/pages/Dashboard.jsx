import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VaccineForm from "../components/VaccineForm.jsx";
import SlipModal from "../components/SlipModal.jsx";

const Dashboard = () => {
  const navigate = useNavigate();
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Called when form submission succeeds
  const handleFormSuccess = (record) => {
    setSubmittedRecord(record);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSubmittedRecord(null);
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="navbar-logo">MDC</span>
          <span className="navbar-title">Vaccination Card System</span>
        </div>
        <div className="navbar-right">
          <span className="navbar-user">👤 {user.email || "Admin"}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>New Vaccination Record</h2>
          <p>Fill in all required fields to generate a vaccination card.</p>
        </div>

        <VaccineForm onSuccess={handleFormSuccess} />
      </main>

      {/* Slip Modal */}
      {showModal && submittedRecord && (
        <SlipModal record={submittedRecord} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Dashboard;

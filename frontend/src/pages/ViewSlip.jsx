import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getVaccineRecord } from "../services/api";

const ViewSlip = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No record ID provided in URL.");
      setLoading(false);
      return;
    }

    const fetchRecord = async () => {
      try {
        const data = await getVaccineRecord(id);
        setRecord(data.record);
      } catch (err) {
        setError(err.response?.data?.message || "Record not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="view-container">
        <div className="view-loading">
          <div className="spinner"></div>
          <p>Loading vaccination record...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-container">
        <div className="view-error">
          <div className="error-icon">❌</div>
          <h2>Record Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      <div className="view-card">
        {/* Header */}
        <div className="view-card-header">
          <div className="view-logo-area">
            <div className="view-logo-circle">MDC</div>
            <div>
              <h1>MAHNOOR DIAGNOSTIC CENTRE</h1>
              <p>Vaccination Verification Card</p>
            </div>
          </div>
          <div className="view-verified-badge">✓ VERIFIED</div>
        </div>

        <div className="view-divider-red"></div>

        {/* Personal Info Grid */}
        <div className="view-section">
          <h3 className="view-section-title">Personal Information</h3>
          <div className="view-info-grid">
            <div className="view-info-item">
              <span className="view-info-label">Full Name</span>
              <span className="view-info-value">{record.name}</span>
            </div>
            <div className="view-info-item">
              <span className="view-info-label">Contact Number</span>
              <span className="view-info-value">{record.contactNumber}</span>
            </div>
            <div className="view-info-item">
              <span className="view-info-label">Passport No</span>
              <span className="view-info-value">{record.passportNo}</span>
            </div>
            <div className="view-info-item">
              <span className="view-info-label">CNIC</span>
              <span className="view-info-value">{record.cnic}</span>
            </div>
            <div className="view-info-item">
              <span className="view-info-label">S/D/W of</span>
              <span className="view-info-value">{record.sdwOf}</span>
            </div>
            <div className="view-info-item">
              <span className="view-info-label">Travelling Country</span>
              <span className="view-info-value">
                {record.travellingCountry}
              </span>
            </div>
          </div>
        </div>

        {/* Vaccine Details Table */}
        <div className="view-section">
          <h3 className="view-section-title">Vaccine Details</h3>
          <table className="view-table">
            <thead>
              <tr>
                <th>Vaccine Name</th>
                <th>Vaccine Date</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{record.vaccineName}</strong>
                </td>
                <td>{formatDate(record.vaccineDate)}</td>
                <td>{record.batchNo}</td>
                <td>{formatDate(record.expiryDate)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="view-footer">
          <div className="view-footer-info">
            <p>378-Saidpur Road, Satellite Town, Rawalpindi</p>
            <p>📞 +92 51 84 34 029 | support@mdc.net.pk</p>
          </div>
          <div className="view-record-id">
            Record ID: <strong>#{record.id}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSlip;

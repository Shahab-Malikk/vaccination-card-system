import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getVaccineRecord, verifyVaccineToken } from "../services/api";

const ViewSlip = () => {
  const [searchParams] = useSearchParams();

  // Support both ?token= (new) and ?id= (old)
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        let data;

        if (token) {
          // New QR format — verify signed JWT token
          data = await verifyVaccineToken(token);
        } else if (id) {
          // Old format — direct UUID lookup
          data = await getVaccineRecord(id);
        } else {
          setError("Invalid verification link.");
          setLoading(false);
          return;
        }

        setRecord(data.record);
      } catch (err) {
        setError(
          err.response?.status === 401
            ? "This verification link is invalid or has expired."
            : "Record not found.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [token, id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Loading
  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.loadingCard}>
          <div style={styles.logoCircle}>MDC</div>
          <h2 style={styles.loadingTitle}>Verifying Card...</h2>
          <div style={styles.spinnerTrack}>
            <div style={styles.spinnerBar}></div>
          </div>
          <p style={styles.loadingSubtitle}>Please wait</p>
        </div>
        <style>{`
          @keyframes slide {
            0% { width: 0% }
            50% { width: 80% }
            100% { width: 100% }
          }
        `}</style>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={styles.centered}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>Verification Failed</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px) }
          to { opacity: 1; transform: translateY(0) }
        }
        .view-card { animation: fadeIn 0.4s ease; }
        @media (max-width: 600px) {
          .info-grid { grid-template-columns: 1fr !important; }
          .card-header { 
            flex-direction: column !important; 
            gap: 12px !important; 
            text-align: center !important; 
          }
          .vaccine-table th, .vaccine-table td { 
            padding: 8px 6px !important; 
            font-size: 12px !important; 
          }
        }
      `}</style>

      <div className="view-card" style={styles.card}>
        {/* Header */}
        <div className="card-header" style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoCircleWhite}>MDC</div>
            <div>
              <h1 style={styles.headerTitle}>MAHNOOR DIAGNOSTIC CENTRE</h1>
              <p style={styles.headerSub}>Vaccination Verification Card</p>
            </div>
          </div>
          <div style={styles.verifiedBadge}>✓ VERIFIED</div>
        </div>

        {/* Red Bar */}
        <div style={styles.redBar}></div>

        {/* Personal Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
          <div className="info-grid" style={styles.infoGrid}>
            <InfoItem label="Full Name" value={record.name} />
            <InfoItem label="Contact Number" value={record.contactNumber} />
            <InfoItem label="Passport No" value={record.passportNo} />
            <InfoItem label="CNIC" value={record.cnic} />
            <InfoItem label="S/D/W of" value={record.sdwOf} />
            <InfoItem
              label="Travelling Country"
              value={record.travellingCountry}
            />
          </div>
        </div>

        {/* Vaccine Details */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💉 Vaccine Details</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="vaccine-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vaccine Name</th>
                  <th style={styles.th}>Vaccine Date</th>
                  <th style={styles.th}>Batch No</th>
                  <th style={styles.th}>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>
                    <strong>{record.vaccineName}</strong>
                  </td>
                  <td style={styles.td}>{formatDate(record.vaccineDate)}</td>
                  <td style={styles.td}>{record.batchNo}</td>
                  <td style={styles.td}>{formatDate(record.expiryDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div>
            <p style={styles.footerText}>
              📍 378-Saidpur Road, Satellite Town, Rawalpindi
            </p>
            <p style={styles.footerText}>
              📞 +92 51 84 34 029 | support@mdc.net.pk
            </p>
          </div>
          <div style={styles.recordId}>✓ Verified Record</div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={styles.infoItem}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={styles.infoValue}>{value}</span>
  </div>
);

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7ff 0%, #e8ecff 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
    width: "100%",
    maxWidth: "780px",
    overflow: "hidden",
  },
  header: {
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px" },
  logoCircleWhite: {
    width: "54px",
    height: "54px",
    background: "white",
    color: "#2c3e93",
    fontSize: "16px",
    fontWeight: "800",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "18px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "0.3px",
  },
  headerSub: { fontSize: "13px", opacity: 0.8, margin: "3px 0 0" },
  verifiedBadge: {
    background: "#27ae60",
    color: "white",
    padding: "8px 18px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    flexShrink: 0,
  },
  redBar: {
    height: "5px",
    background: "linear-gradient(90deg, #c0392b, #922b21)",
  },
  section: { padding: "24px 28px", borderBottom: "1px solid #e8ecff" },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2c3e93",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "16px",
    marginTop: 0,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  infoItem: {
    background: "#f5f7ff",
    padding: "12px 14px",
    borderRadius: "8px",
    borderLeft: "3px solid #2c3e93",
  },
  infoLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#7a7a9a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  infoValue: {
    display: "block",
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: {
    background: "#2c3e93",
    color: "white",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "13px 14px",
    borderBottom: "1px solid #e8ecff",
    color: "#1a1a2e",
  },
  footer: {
    background: "#f5f7ff",
    padding: "16px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
  },
  footerText: { fontSize: "12px", color: "#7a7a9a", margin: "2px 0" },
  recordId: {
    fontSize: "13px",
    color: "#27ae60",
    background: "white",
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #27ae60",
    fontWeight: "600",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7ff, #e8ecff)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "20px",
  },
  loadingCard: {
    background: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
    minWidth: "280px",
  },
  logoCircle: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    fontSize: "18px",
    fontWeight: "800",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  loadingTitle: {
    color: "#1a1a2e",
    fontSize: "20px",
    marginBottom: "20px",
    marginTop: 0,
  },
  spinnerTrack: {
    height: "4px",
    background: "#e8ecff",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "12px",
  },
  spinnerBar: {
    height: "100%",
    background: "linear-gradient(90deg, #2c3e93, #c0392b)",
    borderRadius: "4px",
    animation: "slide 1.5s ease infinite",
  },
  loadingSubtitle: { color: "#7a7a9a", fontSize: "14px", margin: 0 },
  errorCard: {
    background: "white",
    borderRadius: "16px",
    padding: "48px 40px",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
  },
  errorIcon: { fontSize: "48px", marginBottom: "16px" },
  errorTitle: {
    color: "#c0392b",
    fontSize: "22px",
    marginBottom: "8px",
    marginTop: 0,
  },
  errorText: { color: "#7a7a9a", fontSize: "15px", margin: 0 },
};

export default ViewSlip;

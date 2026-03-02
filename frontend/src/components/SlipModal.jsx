import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const SlipModal = ({ record, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Vaccination-Card-${record.id}`,
    pageStyle: `
      @page { size: A4 landscape !important; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const center = record.center || {};

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>✅ Vaccination Card Generated</h2>
          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Actions */}
        <div style={s.actions}>
          <button onClick={handlePrint} style={s.btnPrint}>
            🖨️ Print Card
          </button>
          <button onClick={handlePrint} style={s.btnPdf}>
            📄 Save as PDF
          </button>
          <button onClick={onClose} style={s.btnClose}>
            Close
          </button>
        </div>

        {/* Printable Area */}
        <div style={s.slipWrapper}>
          <div ref={printRef} style={s.slip}>
            {/* Slip Header — uses center branding */}
            <div style={s.slipHeader}>
              <div style={s.slipLogoArea}>
                {center.logo ? (
                  <img src={center.logo} alt="logo" style={s.centerLogoImg} />
                ) : (
                  <div style={s.slipLogoCircle}>MDC</div>
                )}
                <div style={s.slipLogoText}>
                  <h1 style={s.slipCenterName}>{center.name || "MDC"}</h1>
                  <p style={s.slipCenterSub}>Diagnostic Centre</p>
                </div>
              </div>
              <div style={s.slipTitleArea}>
                <h2 style={s.slipTitle}>VACCINATION CARD</h2>
                <p style={s.slipRecordId}>Record ID: #{record.id?.slice(-8)}</p>
              </div>
            </div>

            {/* Red Divider */}
            <div style={s.redBar}></div>

            {/* Body */}
            <div style={s.slipBody}>
              {/* Personal Info */}
              <div style={s.slipPersonal}>
                <SlipField label="Name" value={record.name} />
                {record.contactNumber && (
                  <SlipField label="Contact" value={record.contactNumber} />
                )}
                <SlipField label="Passport No" value={record.passportNo} />
                {record.cnic && <SlipField label="CNIC" value={record.cnic} />}
                <SlipField label="S/D/W of" value={record.sdwOf} />
                <SlipField
                  label="Travelling Country"
                  value={record.travellingCountry}
                />
              </div>

              {/* Vaccine Table */}
              <div style={s.slipVaccine}>
                <div style={s.vaccineHeader}>VACCINE DETAIL</div>
                <table style={s.vaccineTable}>
                  <thead>
                    <tr>
                      <th style={s.vth}>Vaccine Name</th>
                      <th style={s.vth}>Vaccine Date</th>
                      <th style={s.vth}>Batch No</th>
                      {record.expiryDate && <th style={s.vth}>Expiry Date</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={s.vtd}>{record.vaccineName}</td>
                      <td style={s.vtd}>{formatDate(record.vaccineDate)}</td>
                      <td style={s.vtd}>{record.batchNo}</td>
                      {record.expiryDate && (
                        <td style={s.vtd}>{formatDate(record.expiryDate)}</td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* QR Code */}
            {record.qrCode && (
              <div style={s.qrSection}>
                <img src={record.qrCode} alt="QR" style={s.qrImg} />
                <p style={s.qrLabel}>Scan to verify</p>
              </div>
            )}

            {/* Footer — uses center footer */}
            <div style={s.slipFooter}>
              <p style={s.footerText}>
                {center.footer ||
                  "378-Saidpur Road, Satellite Town, Rawalpindi"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SlipField = ({ label, value }) => (
  <div style={{ display: "flex", marginBottom: 8, fontSize: 12, gap: 6 }}>
    <span
      style={{
        fontWeight: 700,
        color: "#4a4a6a",
        minWidth: 110,
        flexShrink: 0,
      }}
    >
      {label}:
    </span>
    <span
      style={{
        color: "#1a1a2e",
        borderBottom: "1px dashed #e0e4f0",
        flex: 1,
        paddingBottom: 1,
      }}
    >
      {value || "—"}
    </span>
  </div>
);

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
    backdropFilter: "blur(4px)",
  },
  container: {
    background: "white",
    borderRadius: 14,
    width: "100%",
    maxWidth: 860,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1px solid #f0f4ff",
  },
  modalTitle: { fontSize: 17, color: "#27ae60", margin: 0, fontWeight: 700 },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#7a7a9a",
    padding: "2px 8px",
    borderRadius: 4,
  },
  actions: {
    display: "flex",
    gap: 10,
    padding: "14px 24px",
    background: "#f8faff",
    borderBottom: "1px solid #f0f4ff",
  },
  btnPrint: {
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    border: "none",
    padding: "9px 18px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPdf: {
    background: "linear-gradient(135deg, #c0392b, #922b21)",
    color: "white",
    border: "none",
    padding: "9px 18px",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnClose: {
    background: "#f5f7ff",
    color: "#4a4a6a",
    border: "1px solid #e0e4f0",
    padding: "9px 18px",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
  },
  slipWrapper: { padding: 24 },
  slip: {
    border: "2px solid #e0e4f0",
    borderRadius: 8,
    background: "white",
    overflow: "hidden",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  slipHeader: {
    padding: "18px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slipLogoArea: { display: "flex", alignItems: "center", gap: 12 },
  centerLogoImg: {
    width: 56,
    height: 56,
    objectFit: "contain",
    borderRadius: 8,
  },
  slipLogoCircle: {
    width: 52,
    height: 52,
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    fontSize: 14,
    fontWeight: 800,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  slipLogoText: {},
  slipCenterName: {
    fontSize: 17,
    color: "#2c3e93",
    fontWeight: 800,
    letterSpacing: 1,
    margin: 0,
  },
  slipCenterSub: {
    fontSize: 10,
    color: "#7a7a9a",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    margin: "3px 0 0",
  },
  slipTitleArea: { textAlign: "right" },
  slipTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#c0392b",
    letterSpacing: "1.5px",
    margin: 0,
  },
  slipRecordId: { fontSize: 11, color: "#7a7a9a", marginTop: 4 },
  redBar: { height: 5, background: "linear-gradient(90deg, #c0392b, #922b21)" },
  slipBody: { display: "grid", gridTemplateColumns: "1fr 1.3fr" },
  slipPersonal: { padding: "18px 20px", borderRight: "1px solid #e0e4f0" },
  slipVaccine: { padding: "18px 20px" },
  vaccineHeader: {
    background: "#2c3e93",
    color: "white",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    padding: "7px 10px",
    textAlign: "center",
    marginBottom: 10,
    borderRadius: 4,
  },
  vaccineTable: { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  vth: {
    background: "#f5f7ff",
    padding: 7,
    textAlign: "center",
    fontWeight: 700,
    color: "#4a4a6a",
    border: "1px solid #e0e4f0",
    fontSize: 10,
    textTransform: "uppercase",
  },
  vtd: {
    padding: 9,
    textAlign: "center",
    border: "1px solid #e0e4f0",
    color: "#1a1a2e",
    fontWeight: 500,
  },
  qrSection: {
    padding: 16,
    borderTop: "1px solid #e0e4f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrImg: { width: 90, height: 90 },
  qrLabel: { fontSize: 10, color: "#7a7a9a", marginTop: 5 },
  slipFooter: {
    background: "#f8faff",
    padding: "10px 22px",
    borderTop: "1px solid #e0e4f0",
    textAlign: "center",
  },
  footerText: { fontSize: 11, color: "#7a7a9a", margin: 0 },
};

export default SlipModal;

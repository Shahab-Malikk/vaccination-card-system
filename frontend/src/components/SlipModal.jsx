import React, { useRef } from "react";

const SlipModal = ({ record, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) {
      alert("Nothing to print. Please try again.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vaccination Card - ${record.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, sans-serif;
              background: white;
              padding: 10mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            @media print {
              body { padding: 0; }
            }

            /* ===== SLIP STYLES ===== */
            .slip {
              border: 2px solid #e0e4f0;
              border-radius: 8px;
              background: white;
              overflow: hidden;
              max-width: 900px;
              margin: 0 auto;
            }
            .slip-header {
              padding: 16px 22px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: white;
            }
            .slip-logo-area {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .slip-logo-img {
              width: 56px;
              height: 56px;
              object-fit: contain;
              border-radius: 8px;
            }
            .slip-logo-circle {
              width: 52px;
              height: 52px;
              background: linear-gradient(135deg, #2c3e93, #1a237e);
              color: white;
              font-size: 14px;
              font-weight: 800;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .slip-center-name {
              font-size: 17px;
              color: #2c3e93;
              font-weight: 800;
              letter-spacing: 1px;
              margin: 0;
            }
            .slip-center-sub {
              font-size: 10px;
              color: #7a7a9a;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin: 3px 0 0;
            }
            .slip-title-area {
              text-align: right;
            }
            .slip-title {
              font-size: 18px;
              font-weight: 800;
              color: #c0392b;
              letter-spacing: 1.5px;
              margin: 0;
            }
            .slip-record-id {
              font-size: 11px;
              color: #7a7a9a;
              margin-top: 4px;
            }
            .red-bar {
              height: 5px;
              background: linear-gradient(90deg, #c0392b, #922b21);
            }
            .slip-body {
              display: grid;
              grid-template-columns: 1fr 1.4fr;
            }
            .slip-personal {
              padding: 16px 20px;
              border-right: 1px solid #e0e4f0;
            }
            .slip-vaccine {
              padding: 16px 20px;
            }
            .field-row {
              display: flex;
              margin-bottom: 9px;
              font-size: 12px;
              gap: 6px;
            }
            .field-label {
              font-weight: 700;
              color: #4a4a6a;
              min-width: 110px;
              flex-shrink: 0;
            }
            .field-value {
              color: #1a1a2e;
              border-bottom: 1px dashed #e0e4f0;
              flex: 1;
              padding-bottom: 1px;
            }
            .vaccine-header {
              background: #2c3e93;
              color: white;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1px;
              padding: 7px 10px;
              text-align: center;
              margin-bottom: 10px;
              border-radius: 4px;
            }
            .vaccine-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            .vaccine-table th {
              background: #f5f7ff;
              padding: 7px;
              text-align: center;
              font-weight: 700;
              color: #4a4a6a;
              border: 1px solid #e0e4f0;
              font-size: 10px;
              text-transform: uppercase;
            }
            .vaccine-table td {
              padding: 9px;
              text-align: center;
              border: 1px solid #e0e4f0;
              color: #1a1a2e;
              font-weight: 500;
            }
            .qr-section {
              padding: 12px 16px;
              border-top: 1px solid #e0e4f0;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .qr-img {
              width: 85px;
              height: 85px;
            }
            .qr-label {
              font-size: 10px;
              color: #7a7a9a;
              margin-top: 4px;
            }
            .slip-footer {
              background: #f8faff;
              padding: 10px 22px;
              border-top: 1px solid #e0e4f0;
              text-align: center;
            }
            .slip-footer p {
              font-size: 11px;
              color: #7a7a9a;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for images (logo/QR) to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.close();
      }
    }, 2000);
  };

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
        {/* Modal Header */}
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>✅ Vaccination Card Ready</h2>
          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Action Buttons */}
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

        {/* Preview Area */}
        <div style={s.previewWrapper}>
          <div ref={printRef}>
            <div className="slip">
              {/* Header */}
              <div className="slip-header">
                <div className="slip-logo-area">
                  {center.logo ? (
                    <img
                      src={center.logo}
                      alt="logo"
                      className="slip-logo-img"
                    />
                  ) : (
                    <div className="slip-logo-circle">MDC</div>
                  )}
                  <div>
                    <h1 className="slip-center-name">{center.name || "MDC"}</h1>
                    <p className="slip-center-sub">Diagnostic Centre</p>
                  </div>
                </div>
                <div className="slip-title-area">
                  <h2 className="slip-title">VACCINATION CARD</h2>
                  <p className="slip-record-id">
                    Record ID: #{record.id?.slice(-8)}
                  </p>
                </div>
              </div>

              {/* Red Bar */}
              <div className="red-bar"></div>

              {/* Body */}
              <div className="slip-body">
                {/* Personal Info */}
                <div className="slip-personal">
                  <FieldRow label="Name" value={record.name} />
                  {record.contactNumber && (
                    <FieldRow label="Contact" value={record.contactNumber} />
                  )}
                  <FieldRow label="Passport No" value={record.passportNo} />
                  {record.cnic && <FieldRow label="CNIC" value={record.cnic} />}
                  <FieldRow label="S/D/W of" value={record.sdwOf} />
                  <FieldRow label="Country" value={record.travellingCountry} />
                </div>

                {/* Vaccine Details */}
                <div className="slip-vaccine">
                  <div className="vaccine-header">VACCINE DETAIL</div>
                  <table className="vaccine-table">
                    <thead>
                      <tr>
                        <th>Vaccine Name</th>
                        <th>Vaccine Date</th>
                        <th>Batch No</th>
                        {record.expiryDate && <th>Expiry Date</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{record.vaccineName}</strong>
                        </td>
                        <td>{formatDate(record.vaccineDate)}</td>
                        <td>{record.batchNo}</td>
                        {record.expiryDate && (
                          <td>{formatDate(record.expiryDate)}</td>
                        )}
                      </tr>
                    </tbody>
                  </table>

                  {/* QR Code */}
                  {record.qrCode && (
                    <div className="qr-section">
                      <img
                        src={record.qrCode}
                        alt="QR Code"
                        className="qr-img"
                      />
                      <p className="qr-label">Scan to verify</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="slip-footer">
                <p>
                  {center.footer ||
                    "378-Saidpur Road, Satellite Town, Rawalpindi"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Field row component
const FieldRow = ({ label, value }) => (
  <div className="field-row">
    <span className="field-label">{label}:</span>
    <span className="field-value">{value || "—"}</span>
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
  previewWrapper: { padding: 24 },
};

export default SlipModal;

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const SlipModal = ({ record, onClose }) => {
  const printRef = useRef(null);

  // v2.15.1 API — use content callback, NOT contentRef
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Vaccination-Card-${record.id}`,
    pageStyle: `
      @page {
        size: A4 landscape !important;
        margin: 8mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>✅ Vaccination Card Generated</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Action Buttons — direct handlePrint call, no setTimeout needed */}
        <div className="modal-actions">
          <button onClick={handlePrint} className="btn-print">
            🖨️ Print Card
          </button>
          <button onClick={handlePrint} className="btn-pdf">
            📄 Save as PDF
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>

        {/* Printable Slip */}
        <div className="slip-wrapper">
          <div ref={printRef} className="vaccination-slip">
            {/* Slip Header */}
            <div className="slip-header">
              <div className="slip-logo-area">
                <div className="slip-logo-circle">MDC</div>
                <div className="slip-logo-text">
                  <h1>MAHNOOR</h1>
                  <p>DIAGNOSTIC CENTRE</p>
                </div>
              </div>
              <div className="slip-title-area">
                <h2>VACCINATION CARD</h2>
                <p className="slip-record-id">Record ID: #{record.id}</p>
              </div>
            </div>

            {/* Red Divider */}
            <div className="slip-divider-red"></div>

            {/* Slip Body */}
            <div className="slip-body">
              {/* Personal Info */}
              <div className="slip-personal">
                <div className="slip-field">
                  <span className="slip-label">Name:</span>
                  <span className="slip-value">{record.name}</span>
                </div>
                <div className="slip-field">
                  <span className="slip-label">Contact:</span>
                  <span className="slip-value">{record.contactNumber}</span>
                </div>
                <div className="slip-field">
                  <span className="slip-label">Passport No:</span>
                  <span className="slip-value">{record.passportNo}</span>
                </div>
                <div className="slip-field">
                  <span className="slip-label">CNIC:</span>
                  <span className="slip-value">{record.cnic}</span>
                </div>
                <div className="slip-field">
                  <span className="slip-label">S/D/W of:</span>
                  <span className="slip-value">{record.sdwOf}</span>
                </div>
                <div className="slip-field">
                  <span className="slip-label">Travelling Country:</span>
                  <span className="slip-value">{record.travellingCountry}</span>
                </div>
              </div>

              {/* Vaccine Details */}
              <div className="slip-vaccine">
                <div className="slip-vaccine-header">VACCINE DETAIL</div>
                <table className="slip-vaccine-table">
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
                      <td>{record.vaccineName}</td>
                      <td>{formatDate(record.vaccineDate)}</td>
                      <td>{record.batchNo}</td>
                      <td>{formatDate(record.expiryDate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* QR Code */}
            {record.qrCode && (
              <div className="slip-qr-section">
                <div className="slip-qr-wrapper">
                  <img
                    src={record.qrCode}
                    alt="QR Code"
                    className="slip-qr-image"
                  />
                  <p className="slip-qr-label">Scan to verify</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="slip-footer">
              <p>378-Saidpur Road, Satellite Town, Rawalpindi</p>
              <p>📞 +92 51 84 34 029 | support@mdc.net.pk | www.mdc.net.pk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlipModal;

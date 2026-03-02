import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyRecords,
  submitVaccineRecord,
  updateRecord,
  getBatches,
} from "../services/api";
import SlipModal from "../components/SlipModal.jsx";
import { useReactToPrint } from "react-to-print";

const COUNTRIES = [
  "Saudi Arabia",
  "UAE",
  "United Kingdom",
  "USA",
  "Canada",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Malaysia",
  "Turkey",
  "China",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Jordan",
  "Egypt",
  "South Africa",
  "Indonesia",
];

const CenterDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const center = user.center || {};

  const [activeTab, setActiveTab] = useState("form");
  const [batches, setBatches] = useState([]);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Form state
  const [form, setForm] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal / print state
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Edit state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reprint
  const [reprintRecord, setReprintRecord] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);

  const [alert, setAlert] = useState({ msg: "", type: "" });

  useEffect(() => {
    fetchBatches();
  }, []);
  useEffect(() => {
    if (activeTab === "records") fetchRecords();
  }, [activeTab]);

  const fetchBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data.batches);
    } catch (err) {}
  };

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const data = await getMyRecords();
      setRecords(data.records);
    } catch (err) {
      showAlert("Failed to load records.", "error");
    } finally {
      setLoadingRecords(false);
    }
  };

  const showAlert = (msg, type = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: "", type: "" }), 3000);
  };

  function emptyForm() {
    return {
      name: "",
      contactNumber: "",
      passportNo: "",
      cnic: "",
      sdwOf: "",
      travellingCountry: "",
      batchUuid: "",
      vaccineDate: "",
    };
  }

  const validateForm = (f) => {
    const errors = {};
    if (!f.name?.trim()) errors.name = "Required";
    if (!f.passportNo?.trim()) errors.passportNo = "Required";
    if (!f.sdwOf?.trim()) errors.sdwOf = "Required";
    if (!f.travellingCountry) errors.travellingCountry = "Required";
    if (!f.batchUuid) errors.batchUuid = "Please select a vaccine";
    if (!f.vaccineDate) errors.vaccineDate = "Required";
    return errors;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const data = await submitVaccineRecord(form);
      // Attach center info to record for slip
      setSubmittedRecord({ ...data.record, center });
      setShowModal(true);
      setForm(emptyForm());
      setFormErrors({});
    } catch (err) {
      setFormError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit handlers
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditForm({
      name: record.name,
      contactNumber: record.contactNumber || "",
      passportNo: record.passportNo,
      cnic: record.cnic || "",
      sdwOf: record.sdwOf,
      travellingCountry: record.travellingCountry,
      vaccineDate: record.vaccineDate,
    });
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateEditForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setEditSubmitting(true);
    try {
      const data = await updateRecord(editingRecord.id, editForm);
      showAlert("Record updated successfully!");
      setEditingRecord(null);
      fetchRecords();
      // Offer reprint with updated record
      setReprintRecord({ ...data.record, center });
      setShowReprintModal(true);
    } catch (err) {
      showAlert(err.response?.data?.message || "Update failed.", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const validateEditForm = (f) => {
    const errors = {};
    if (!f.name?.trim()) errors.name = "Required";
    if (!f.passportNo?.trim()) errors.passportNo = "Required";
    if (!f.sdwOf?.trim()) errors.sdwOf = "Required";
    if (!f.travellingCountry) errors.travellingCountry = "Required";
    if (!f.vaccineDate) errors.vaccineDate = "Required";
    return errors;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "N/A";

  return (
    <div style={s.page}>
      {/* Navbar — shows center name after login */}
      <nav style={s.navbar}>
        <div style={s.navBrand}>
          {center.logo && (
            <img
              src={center.logo}
              alt="logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: "contain",
                background: "white",
                padding: 4,
              }}
            />
          )}
          <div>
            <div style={s.navTitle}>{center.name || "Center Dashboard"}</div>
            <div style={s.navSub}>Vaccination Card System</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={s.navUser}>👤 {user.email}</span>
          <button onClick={handleLogout} style={s.btnLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div style={s.container}>
        {/* Alert */}
        {alert.msg && (
          <div style={alert.type === "error" ? s.alertError : s.alertSuccess}>
            {alert.msg}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={activeTab === "form" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("form")}
          >
            📋 New Record
          </button>
          <button
            style={activeTab === "records" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("records")}
          >
            📁 All Records
          </button>
        </div>

        {/* ===== FORM TAB ===== */}
        {activeTab === "form" && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>New Vaccination Record</h2>

            <form onSubmit={handleSubmit} noValidate>
              {/* Personal Info */}
              <div style={s.sectionLabel}>👤 Personal Information</div>
              <div style={s.formGrid}>
                <Field label="Full Name *" error={formErrors.name}>
                  <input
                    style={inp(formErrors.name)}
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Contact Number" error={formErrors.contactNumber}>
                  <input
                    style={inp()}
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Passport No *" error={formErrors.passportNo}>
                  <input
                    style={inp(formErrors.passportNo)}
                    name="passportNo"
                    value={form.passportNo}
                    onChange={handleFormChange}
                    placeholder="e.g. AB1234567"
                  />
                </Field>
                <Field label="CNIC" error={formErrors.cnic}>
                  <input
                    style={inp()}
                    name="cnic"
                    value={form.cnic}
                    onChange={handleFormChange}
                    placeholder="Optional — 12345-1234567-1"
                  />
                </Field>
                <Field label="S/D/W of *" error={formErrors.sdwOf}>
                  <input
                    style={inp(formErrors.sdwOf)}
                    name="sdwOf"
                    value={form.sdwOf}
                    onChange={handleFormChange}
                    placeholder="Son/Daughter/Wife of"
                  />
                </Field>
                <Field
                  label="Travelling Country *"
                  error={formErrors.travellingCountry}
                >
                  <select
                    style={inp(formErrors.travellingCountry)}
                    name="travellingCountry"
                    value={form.travellingCountry}
                    onChange={handleFormChange}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Vaccine Info */}
              <div style={{ ...s.sectionLabel, marginTop: 8 }}>
                💉 Vaccine Details
              </div>
              <div style={s.formGrid}>
                <Field label="Select Vaccine *" error={formErrors.batchUuid}>
                  <select
                    style={inp(formErrors.batchUuid)}
                    name="batchUuid"
                    value={form.batchUuid}
                    onChange={handleFormChange}
                  >
                    <option value="">Select vaccine batch</option>
                    {batches.map((b) => (
                      <option key={b.uuid} value={b.uuid}>
                        {b.vaccine_name} — {b.batch_no} (Exp:{" "}
                        {formatDate(b.expiry_date)})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Vaccine Date *" error={formErrors.vaccineDate}>
                  <input
                    style={inp(formErrors.vaccineDate)}
                    type="date"
                    name="vaccineDate"
                    value={form.vaccineDate}
                    onChange={handleFormChange}
                  />
                </Field>
              </div>

              {formError && <div style={s.alertError}>{formError}</div>}

              <button
                type="submit"
                style={{
                  ...s.btnPrimary,
                  width: "100%",
                  padding: "14px",
                  fontSize: 16,
                  marginTop: 8,
                }}
                disabled={submitting}
              >
                {submitting
                  ? "⏳ Generating Card..."
                  : "✅ Generate Vaccination Card"}
              </button>
            </form>
          </div>
        )}

        {/* ===== RECORDS TAB ===== */}
        {activeTab === "records" && (
          <div>
            {/* Edit Form */}
            {editingRecord && (
              <div style={s.formCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    ✏️ Edit Record
                  </h3>
                  <button
                    style={s.btnSecondary}
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </button>
                </div>

                {/* Non-editable fields info */}
                <div style={s.lockedInfo}>
                  🔒 Vaccine: <strong>{editingRecord.vaccineName}</strong>{" "}
                  &nbsp;|&nbsp; Batch: <strong>{editingRecord.batchNo}</strong>{" "}
                  &nbsp;|&nbsp; Expiry:{" "}
                  <strong>{formatDate(editingRecord.expiryDate)}</strong>
                  <span style={s.lockedNote}>
                    (These fields cannot be edited)
                  </span>
                </div>

                <form onSubmit={handleEditSubmit} noValidate>
                  <div style={s.formGrid}>
                    <Field label="Full Name *" error={editErrors.name}>
                      <input
                        style={inp(editErrors.name)}
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                      />
                    </Field>
                    <Field
                      label="Contact Number"
                      error={editErrors.contactNumber}
                    >
                      <input
                        style={inp()}
                        name="contactNumber"
                        value={editForm.contactNumber}
                        onChange={handleEditChange}
                      />
                    </Field>
                    <Field label="Passport No *" error={editErrors.passportNo}>
                      <input
                        style={inp(editErrors.passportNo)}
                        name="passportNo"
                        value={editForm.passportNo}
                        onChange={handleEditChange}
                      />
                    </Field>
                    <Field label="CNIC" error={editErrors.cnic}>
                      <input
                        style={inp()}
                        name="cnic"
                        value={editForm.cnic}
                        onChange={handleEditChange}
                      />
                    </Field>
                    <Field label="S/D/W of *" error={editErrors.sdwOf}>
                      <input
                        style={inp(editErrors.sdwOf)}
                        name="sdwOf"
                        value={editForm.sdwOf}
                        onChange={handleEditChange}
                      />
                    </Field>
                    <Field
                      label="Travelling Country *"
                      error={editErrors.travellingCountry}
                    >
                      <select
                        style={inp(editErrors.travellingCountry)}
                        name="travellingCountry"
                        value={editForm.travellingCountry}
                        onChange={handleEditChange}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Vaccine Date *"
                      error={editErrors.vaccineDate}
                    >
                      <input
                        style={inp(editErrors.vaccineDate)}
                        type="date"
                        name="vaccineDate"
                        value={editForm.vaccineDate}
                        onChange={handleEditChange}
                      />
                    </Field>
                  </div>
                  <button
                    type="submit"
                    style={s.btnPrimary}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "Saving..." : "💾 Save Changes"}
                  </button>
                </form>
              </div>
            )}

            {/* Records Table */}
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Vaccination Records</h2>
              <button style={s.btnSecondary} onClick={fetchRecords}>
                🔄 Refresh
              </button>
            </div>

            {loadingRecords ? (
              <div style={s.loading}>Loading records...</div>
            ) : records.length === 0 ? (
              <div style={s.empty}>No records yet.</div>
            ) : (
              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Patient Name</th>
                      <th style={s.th}>Passport No</th>
                      <th style={s.th}>Vaccine</th>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Country</th>
                      <th style={s.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        style={
                          editingRecord?.id === record.id
                            ? { background: "#eaf2ff" }
                            : {}
                        }
                      >
                        <td style={s.td}>
                          <strong>{record.name}</strong>
                        </td>
                        <td style={s.td}>{record.passportNo}</td>
                        <td style={s.td}>{record.vaccineName}</td>
                        <td style={s.td}>{formatDate(record.vaccineDate)}</td>
                        <td style={s.td}>{record.travellingCountry}</td>
                        <td style={s.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              style={s.btnEdit}
                              onClick={() => handleEditClick(record)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              style={s.btnPrint}
                              onClick={() => {
                                setReprintRecord({ ...record, center });
                                setShowReprintModal(true);
                              }}
                            >
                              🖨️ Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slip Modal — new record */}
      {showModal && submittedRecord && (
        <SlipModal
          record={submittedRecord}
          onClose={() => {
            setShowModal(false);
            setSubmittedRecord(null);
          }}
        />
      )}

      {/* Reprint Modal — existing record */}
      {showReprintModal && reprintRecord && (
        <SlipModal
          record={reprintRecord}
          onClose={() => {
            setShowReprintModal(false);
            setReprintRecord(null);
          }}
        />
      )}
    </div>
  );
};

// Small reusable field wrapper
const Field = ({ label, error, children }) => (
  <div style={{ marginBottom: 4 }}>
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "#7a7a9a",
        textTransform: "uppercase",
        letterSpacing: "0.4px",
        marginBottom: 6,
      }}
    >
      {label}
    </label>
    {children}
    {error && (
      <span
        style={{
          color: "#c0392b",
          fontSize: 12,
          marginTop: 3,
          display: "block",
        }}
      >
        {error}
      </span>
    )}
  </div>
);

const inp = (err) => ({
  width: "100%",
  padding: "10px 13px",
  border: `1.5px solid ${err ? "#c0392b" : "#e0e4f0"}`,
  borderRadius: 7,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: err ? "#fff9f9" : "white",
});

const s = {
  page: {
    minHeight: "100vh",
    background: "#f5f7ff",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  navbar: {
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    padding: "0 28px",
    height: 68,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBrand: { display: "flex", alignItems: "center", gap: 14 },
  navTitle: { fontSize: 16, fontWeight: 700 },
  navSub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  navUser: { fontSize: 13, opacity: 0.85 },
  btnLogout: {
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.4)",
    padding: "7px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  container: { maxWidth: 960, margin: "0 auto", padding: "32px 20px" },
  alertError: {
    background: "#fdecea",
    color: "#c0392b",
    border: "1px solid #f5c6cb",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
  },
  alertSuccess: {
    background: "#eafaf1",
    color: "#27ae60",
    border: "1px solid #a9dfbf",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 20,
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 28,
    background: "white",
    padding: 6,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    width: "fit-content",
  },
  tab: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#7a7a9a",
  },
  tabActive: {
    padding: "10px 22px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "white",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2c3e93",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: "2px solid #f0f4ff",
  },
  formCard: {
    background: "white",
    borderRadius: 12,
    padding: "28px 32px",
    marginBottom: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: 22,
    marginTop: 0,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "#f5f7ff",
    color: "#4a4a6a",
    border: "1px solid #e0e4f0",
    padding: "10px 20px",
    borderRadius: 7,
    fontSize: 14,
    cursor: "pointer",
  },
  btnEdit: {
    background: "#eaf2ff",
    color: "#2c3e93",
    border: "1px solid #c5d8ff",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
  btnPrint: {
    background: "#eafaf1",
    color: "#27ae60",
    border: "1px solid #a9dfbf",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
  lockedInfo: {
    background: "#fff8e1",
    border: "1px solid #ffe082",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#7a5a00",
    marginBottom: 16,
  },
  lockedNote: {
    marginLeft: 10,
    fontSize: 11,
    color: "#c0392b",
    fontStyle: "italic",
  },
  loading: { textAlign: "center", padding: 40, color: "#7a7a9a" },
  empty: {
    textAlign: "center",
    padding: 40,
    color: "#7a7a9a",
    background: "white",
    borderRadius: 12,
  },
  tableWrapper: {
    background: "white",
    borderRadius: 12,
    overflow: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 700 },
  th: {
    background: "#2c3e93",
    color: "white",
    padding: "12px 16px",
    textAlign: "left",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  td: {
    padding: "13px 16px",
    borderBottom: "1px solid #f0f4ff",
    fontSize: 14,
    color: "#1a1a2e",
  },
};

export default CenterDashboard;

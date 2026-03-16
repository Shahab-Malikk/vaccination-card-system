import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyRecords,
  submitVaccineRecord,
  updateRecord,
  getBatches,
  searchRecords,
} from "../services/api";
import SlipModal from "../components/SlipModal.jsx";

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

  // Modal state
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Edit state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSource, setEditSource] = useState("records");

  // Reprint state
  const [reprintRecord, setReprintRecord] = useState(null);
  const [showReprintModal, setShowReprintModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchDone, setSearchDone] = useState(false);

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

  // ===== SEARCH =====
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchError("Enter at least 2 characters to search.");
      return;
    }
    setSearchError("");
    setSearchLoading(true);
    setSearchDone(false);
    setEditingRecord(null);
    try {
      const data = await searchRecords(searchQuery.trim());
      setSearchResults(data.records);
      setSearchDone(true);
    } catch (err) {
      setSearchError(err.response?.data?.message || "Search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchDone(false);
    setSearchError("");
    setEditingRecord(null);
  };

  // ===== EDIT =====
  const handleEditClick = (record, source = "records") => {
    setEditSource(source);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
    if (editErrors[name]) setEditErrors((p) => ({ ...p, [name]: "" }));
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
      if (editSource === "records") {
        fetchRecords();
      } else if (editSource === "search") {
        const refreshed = await searchRecords(searchQuery.trim());
        setSearchResults(refreshed.records);
      }
      setReprintRecord({ ...data.record, center });
      setShowReprintModal(true);
    } catch (err) {
      showAlert(err.response?.data?.message || "Update failed.", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "N/A";

  // Shared record rows renderer
  const renderRecordRows = (list, source) =>
    list.map((record) => (
      <tr
        key={record.id}
        style={
          editingRecord?.id === record.id
            ? { background: "#eaf2ff" }
            : { background: "white" }
        }
      >
        <td style={s.td}>
          <strong>{record.name}</strong>
        </td>
        <td style={s.td}>{record.passportNo}</td>
        <td style={s.td}>{record.cnic || "—"}</td>
        <td style={s.td}>{record.vaccineName}</td>
        <td style={s.td}>{formatDate(record.vaccineDate)}</td>
        <td style={s.td}>{record.travellingCountry}</td>
        <td style={s.td}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={s.btnEdit}
              onClick={() => handleEditClick(record, source)}
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
    ));

  // Edit form — reusable block
  const renderEditForm = () => (
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
        <button style={s.btnSecondary} onClick={() => setEditingRecord(null)}>
          Cancel
        </button>
      </div>
      <div style={s.lockedInfo}>
        🔒 Vaccine: <strong>{editingRecord.vaccineName}</strong> &nbsp;|&nbsp;
        Batch: <strong>{editingRecord.batchNo}</strong> &nbsp;|&nbsp; Expiry:{" "}
        <strong>{formatDate(editingRecord.expiryDate)}</strong>
        <span style={s.lockedNote}>(Cannot be edited)</span>
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
          <Field label="Contact Number" error={editErrors.contactNumber}>
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
          <Field label="Vaccine Date *" error={editErrors.vaccineDate}>
            <input
              style={inp(editErrors.vaccineDate)}
              type="date"
              name="vaccineDate"
              value={editForm.vaccineDate}
              onChange={handleEditChange}
            />
          </Field>
        </div>
        <button type="submit" style={s.btnPrimary} disabled={editSubmitting}>
          {editSubmitting ? "Saving..." : "💾 Save Changes"}
        </button>
      </form>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Navbar */}
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
            onClick={() => {
              setActiveTab("form");
              setEditingRecord(null);
            }}
          >
            📋 New Record
          </button>
          <button
            style={activeTab === "records" ? s.tabActive : s.tab}
            onClick={() => {
              setActiveTab("records");
              setEditingRecord(null);
            }}
          >
            📁 All Records
          </button>
        </div>

        {/* ===== NEW RECORD TAB ===== */}
        {activeTab === "form" && (
          <div>
            {/* ── SEARCH CARD ── */}
            <div style={s.searchCard}>
              {/* Padded top section */}
              <div style={{ padding: "22px 28px 18px" }}>
                <div style={s.searchTitle}>🔍 Find Existing Record</div>
                <p style={s.searchSub}>Search by CNIC or Passport Number</p>
                <form onSubmit={handleSearch} noValidate>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      style={{
                        ...inp(),
                        flex: 1,
                        fontSize: 14,
                        padding: "11px 14px",
                      }}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchError("");
                        if (!e.target.value) {
                          setSearchResults([]);
                          setSearchDone(false);
                          setEditingRecord(null);
                        }
                      }}
                      placeholder="Enter CNIC (12345-1234567-1) or Passport No..."
                    />
                    <button
                      type="submit"
                      style={{ ...s.btnPrimary, padding: "11px 22px" }}
                      disabled={searchLoading}
                    >
                      {searchLoading ? "⏳" : "🔍 Search"}
                    </button>
                    {searchDone && (
                      <button
                        type="button"
                        style={s.btnSecondary}
                        onClick={handleClearSearch}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  {searchError && (
                    <div
                      style={{ color: "#c0392b", fontSize: 13, marginTop: 8 }}
                    >
                      {searchError}
                    </div>
                  )}
                </form>
              </div>

              {/* Search Results */}
              {searchDone && (
                <div>
                  {searchResults.length === 0 ? (
                    <div
                      style={{
                        margin: "0 28px 22px",
                        background: "#f8faff",
                        borderRadius: 8,
                        padding: 16,
                        textAlign: "center",
                        color: "#7a7a9a",
                        fontSize: 14,
                      }}
                    >
                      No records found for <strong>"{searchQuery}"</strong>
                    </div>
                  ) : (
                    <div>
                      {/* Result count */}
                      <div
                        style={{
                          padding: "0 28px 10px",
                          fontSize: 13,
                          color: "#4a4a6a",
                        }}
                      >
                        {searchResults.length} record
                        {searchResults.length > 1 ? "s" : ""} found for{" "}
                        <strong>"{searchQuery}"</strong>
                      </div>

                      {/* Full width table */}
                      <div
                        style={{
                          borderTop: "1px solid #e8f0ff",
                          overflowX: "auto",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: 650,
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={s.th}>Patient Name</th>
                              <th style={s.th}>Passport No</th>
                              <th style={s.th}>CNIC</th>
                              <th style={s.th}>Vaccine</th>
                              <th style={s.th}>Date</th>
                              <th style={s.th}>Country</th>
                              <th style={s.th}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renderRecordRows(searchResults, "search")}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Edit form — only when editing from search */}
            {editingRecord && editSource === "search" && renderEditForm()}

            {/* Divider */}
            <div style={s.divider}>
              <div style={s.dividerLine}></div>
              <span style={s.dividerText}>OR CREATE NEW RECORD</span>
              <div style={s.dividerLine}></div>
            </div>

            {/* ── NEW RECORD FORM ── */}
            <div style={s.formCard}>
              <h2 style={s.formTitle}>New Vaccination Record</h2>
              <form onSubmit={handleSubmit} noValidate>
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
                  <Field
                    label="Contact Number"
                    error={formErrors.contactNumber}
                  >
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
          </div>
        )}

        {/* ===== ALL RECORDS TAB ===== */}
        {activeTab === "records" && (
          <div>
            {/* Edit form — only when editing from records tab */}
            {editingRecord && editSource === "records" && renderEditForm()}

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
                      <th style={s.th}>CNIC</th>
                      <th style={s.th}>Vaccine</th>
                      <th style={s.th}>Date</th>
                      <th style={s.th}>Country</th>
                      <th style={s.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{renderRecordRows(records, "records")}</tbody>
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

      {/* Reprint Modal */}
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

// ===== REUSABLE FIELD =====
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

// ===== STYLES =====
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
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  },
  td: {
    padding: "13px 16px",
    borderBottom: "1px solid #f0f4ff",
    fontSize: 14,
    color: "#1a1a2e",
  },

  // Search
  searchCard: {
    background: "white",
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1.5px solid #e8f0ff",
    overflow: "hidden",
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2c3e93",
    marginBottom: 4,
  },
  searchSub: { fontSize: 13, color: "#7a7a9a", marginBottom: 14, marginTop: 0 },

  // Divider
  divider: { display: "flex", alignItems: "center", gap: 14, margin: "20px 0" },
  dividerLine: { flex: 1, height: 1, background: "#e0e4f0" },
  dividerText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#b0b4c8",
    letterSpacing: "0.8px",
    whiteSpace: "nowrap",
  },
};

export default CenterDashboard;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCenters,
  createCenter,
  updateCenter,
  deleteCenter,
  getCenterUser,
  createCenterUser,
  deleteCenterUser,
  getBatches,
  createBatch,
  deleteBatch,
  changePassword,
} from "../services/api";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("centers");

  // Centers state
  const [centers, setCenters] = useState([]);
  const [centerLoading, setCenterLoading] = useState(false);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [centerForm, setCenterForm] = useState({
    name: "",
    logo: "",
    footer: "",
  });
  const [expandedCenter, setExpandedCenter] = useState(null);
  const [centerUsers, setCenterUsers] = useState({});
  const [userForms, setUserForms] = useState({});
  const [showUserForm, setShowUserForm] = useState({});

  // Batches state
  const [batches, setBatches] = useState([]);
  const [batchForm, setBatchForm] = useState({
    vaccineName: "",
    batchNo: "",
    expiryDate: "",
  });
  const [batchLoading, setBatchLoading] = useState(false);

  // Password change state
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCenters();
  }, []);
  useEffect(() => {
    if (activeTab === "batches") fetchBatches();
  }, [activeTab]);

  const fetchCenters = async () => {
    setCenterLoading(true);
    try {
      const data = await getCenters();
      setCenters(data.centers);
    } catch (err) {
      setError("Failed to load centers.");
    } finally {
      setCenterLoading(false);
    }
  };

  const fetchBatches = async () => {
    setBatchLoading(true);
    try {
      const data = await getBatches();
      setBatches(data.batches);
    } catch (err) {
      setError("Failed to load batches.");
    } finally {
      setBatchLoading(false);
    }
  };

  const fetchCenterUser = async (centerUuid) => {
    try {
      const data = await getCenterUser(centerUuid);
      setCenterUsers((prev) => ({ ...prev, [centerUuid]: data.user }));
    } catch (err) {}
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCenterForm((prev) => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCenterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingCenter) {
        await updateCenter(editingCenter.uuid, centerForm);
        showMsg("Center updated successfully!");
      } else {
        await createCenter(centerForm);
        showMsg("Center created successfully!");
      }
      setCenterForm({ name: "", logo: "", footer: "" });
      setShowCenterForm(false);
      setEditingCenter(null);
      fetchCenters();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save center.");
    }
  };

  const handleEditCenter = (center) => {
    setEditingCenter(center);
    setCenterForm({
      name: center.name,
      logo: center.logo || "",
      footer: center.footer || "",
    });
    setShowCenterForm(true);
  };

  const handleDeleteCenter = async (uuid) => {
    if (!window.confirm("Delete this center? This cannot be undone.")) return;
    try {
      await deleteCenter(uuid);
      showMsg("Center deleted.");
      fetchCenters();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete center.");
    }
  };

  const toggleExpand = async (centerUuid) => {
    if (expandedCenter === centerUuid) {
      setExpandedCenter(null);
    } else {
      setExpandedCenter(centerUuid);
      if (!centerUsers[centerUuid]) {
        await fetchCenterUser(centerUuid);
      }
    }
  };

  const handleCreateUser = async (centerUuid) => {
    const form = userForms[centerUuid] || {};
    setError("");
    try {
      await createCenterUser(centerUuid, {
        email: form.email,
        password: form.password,
      });
      showMsg("User created successfully!");
      setShowUserForm((prev) => ({ ...prev, [centerUuid]: false }));
      await fetchCenterUser(centerUuid);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    }
  };

  const handleDeleteUser = async (centerUuid) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteCenterUser(centerUuid);
      showMsg("User deleted.");
      setCenterUsers((prev) => ({ ...prev, [centerUuid]: null }));
    } catch (err) {
      setError("Failed to delete user.");
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createBatch(batchForm);
      showMsg("Batch added successfully!");
      setBatchForm({ vaccineName: "", batchNo: "", expiryDate: "" });
      fetchBatches();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add batch.");
    }
  };

  const handleDeleteBatch = async (uuid) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await deleteBatch(uuid);
      showMsg("Batch deleted.");
      fetchBatches();
    } catch (err) {
      setError("Failed to delete batch.");
    }
  };

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setError("");

    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = "Required";
    if (!pwForm.newPassword) errors.newPassword = "Required";
    else if (pwForm.newPassword.length < 6)
      errors.newPassword = "Min 6 characters";
    if (!pwForm.confirmPassword) errors.confirmPassword = "Required";
    else if (pwForm.newPassword !== pwForm.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }

    setPwLoading(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      showMsg("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const showMsg = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.navbar}>
        <div style={s.navBrand}>
          <span style={s.navLogo}>MDC</span>
          <span style={s.navTitle}>Super Admin Panel</span>
        </div>
        <button onClick={handleLogout} style={s.btnLogout}>
          Logout
        </button>
      </nav>

      <div style={s.container}>
        {/* Alerts */}
        {error && <div style={s.alertError}>{error}</div>}
        {success && <div style={s.alertSuccess}>{success}</div>}

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={activeTab === "centers" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("centers")}
          >
            🏥 Medical Centers
          </button>
          <button
            style={activeTab === "batches" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("batches")}
          >
            💉 Vaccine Batches
          </button>
          <button
            style={activeTab === "settings" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* ===== CENTERS TAB ===== */}
        {activeTab === "centers" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Medical Centers</h2>
              <button
                style={s.btnPrimary}
                onClick={() => {
                  setShowCenterForm(!showCenterForm);
                  setEditingCenter(null);
                  setCenterForm({ name: "", logo: "", footer: "" });
                }}
              >
                {showCenterForm ? "Cancel" : "+ Add New Center"}
              </button>
            </div>

            {showCenterForm && (
              <div style={s.formCard}>
                <h3 style={s.formTitle}>
                  {editingCenter ? "Edit Center" : "Add New Center"}
                </h3>
                <form onSubmit={handleCenterSubmit}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Center Name *</label>
                    <input
                      style={s.input}
                      type="text"
                      value={centerForm.name}
                      onChange={(e) =>
                        setCenterForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. MDC Rawalpindi"
                      required
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Footer / Address</label>
                    <textarea
                      style={{ ...s.input, height: "80px", resize: "vertical" }}
                      value={centerForm.footer}
                      onChange={(e) =>
                        setCenterForm((p) => ({ ...p, footer: e.target.value }))
                      }
                      placeholder="378-Saidpur Road, Satellite Town, Rawalpindi | +92 51 84 34 029"
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Logo (Image Upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={s.input}
                    />
                    {centerForm.logo && (
                      <img
                        src={centerForm.logo}
                        alt="preview"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "contain",
                          marginTop: 8,
                          borderRadius: 8,
                          border: "1px solid #e0e4f0",
                        }}
                      />
                    )}
                  </div>
                  <div style={s.formActions}>
                    <button type="submit" style={s.btnPrimary}>
                      {editingCenter ? "Update Center" : "Create Center"}
                    </button>
                    <button
                      type="button"
                      style={s.btnSecondary}
                      onClick={() => {
                        setShowCenterForm(false);
                        setEditingCenter(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {centerLoading ? (
              <div style={s.loading}>Loading centers...</div>
            ) : centers.length === 0 ? (
              <div style={s.empty}>
                No centers yet. Add your first center above.
              </div>
            ) : (
              <div style={s.centerList}>
                {centers.map((center) => (
                  <div key={center.uuid} style={s.centerCard}>
                    <div style={s.centerRow}>
                      <div style={s.centerInfo}>
                        {center.logo && (
                          <img
                            src={center.logo}
                            alt="logo"
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 8,
                              objectFit: "contain",
                              border: "1px solid #e0e4f0",
                            }}
                          />
                        )}
                        <div>
                          <div style={s.centerName}>{center.name}</div>
                          {center.footer && (
                            <div style={s.centerFooter}>{center.footer}</div>
                          )}
                        </div>
                      </div>
                      <div style={s.centerActions}>
                        <button
                          style={s.btnEdit}
                          onClick={() => handleEditCenter(center)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={s.btnExpand}
                          onClick={() => toggleExpand(center.uuid)}
                        >
                          {expandedCenter === center.uuid
                            ? "▲ Collapse"
                            : "▼ Manage User"}
                        </button>
                        <button
                          style={s.btnDelete}
                          onClick={() => handleDeleteCenter(center.uuid)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {expandedCenter === center.uuid && (
                      <div style={s.userSection}>
                        <h4 style={s.userSectionTitle}>Center Login User</h4>
                        {centerUsers[center.uuid] ? (
                          <div style={s.userCard}>
                            <div>
                              <span style={s.userEmail}>
                                {centerUsers[center.uuid].email}
                              </span>
                              <span style={s.userRole}>center_admin</span>
                            </div>
                            <button
                              style={s.btnDelete}
                              onClick={() => handleDeleteUser(center.uuid)}
                            >
                              Delete User
                            </button>
                          </div>
                        ) : (
                          <div>
                            {!showUserForm[center.uuid] ? (
                              <button
                                style={s.btnPrimary}
                                onClick={() =>
                                  setShowUserForm((p) => ({
                                    ...p,
                                    [center.uuid]: true,
                                  }))
                                }
                              >
                                + Create Login
                              </button>
                            ) : (
                              <div style={s.userForm}>
                                <input
                                  style={s.input}
                                  type="email"
                                  placeholder="Email"
                                  value={userForms[center.uuid]?.email || ""}
                                  onChange={(e) =>
                                    setUserForms((p) => ({
                                      ...p,
                                      [center.uuid]: {
                                        ...p[center.uuid],
                                        email: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <input
                                  style={s.input}
                                  type="password"
                                  placeholder="Password (min 6 chars)"
                                  value={userForms[center.uuid]?.password || ""}
                                  onChange={(e) =>
                                    setUserForms((p) => ({
                                      ...p,
                                      [center.uuid]: {
                                        ...p[center.uuid],
                                        password: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <div style={s.formActions}>
                                  <button
                                    style={s.btnPrimary}
                                    onClick={() =>
                                      handleCreateUser(center.uuid)
                                    }
                                  >
                                    Create User
                                  </button>
                                  <button
                                    style={s.btnSecondary}
                                    onClick={() =>
                                      setShowUserForm((p) => ({
                                        ...p,
                                        [center.uuid]: false,
                                      }))
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== BATCHES TAB ===== */}
        {activeTab === "batches" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Global Vaccine Batches</h2>
            </div>

            <div style={s.formCard}>
              <h3 style={s.formTitle}>Add New Batch</h3>
              <form onSubmit={handleBatchSubmit}>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Vaccine Name *</label>
                    <input
                      style={s.input}
                      type="text"
                      value={batchForm.vaccineName}
                      onChange={(e) =>
                        setBatchForm((p) => ({
                          ...p,
                          vaccineName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Meningitis ACYW135"
                      required
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Batch No *</label>
                    <input
                      style={s.input}
                      type="text"
                      value={batchForm.batchNo}
                      onChange={(e) =>
                        setBatchForm((p) => ({ ...p, batchNo: e.target.value }))
                      }
                      placeholder="e.g. BN-2024-001"
                      required
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Expiry Date *</label>
                    <input
                      style={s.input}
                      type="date"
                      value={batchForm.expiryDate}
                      onChange={(e) =>
                        setBatchForm((p) => ({
                          ...p,
                          expiryDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <button type="submit" style={s.btnPrimary}>
                  + Add Batch
                </button>
              </form>
            </div>

            {batchLoading ? (
              <div style={s.loading}>Loading batches...</div>
            ) : batches.length === 0 ? (
              <div style={s.empty}>No batches yet.</div>
            ) : (
              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Vaccine Name</th>
                      <th style={s.th}>Batch No</th>
                      <th style={s.th}>Expiry Date</th>
                      <th style={s.th}>Added On</th>
                      <th style={s.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr key={batch.uuid}>
                        <td style={s.td}>
                          <strong>{batch.vaccine_name}</strong>
                        </td>
                        <td style={s.td}>{batch.batch_no}</td>
                        <td style={s.td}>{formatDate(batch.expiry_date)}</td>
                        <td style={s.td}>{formatDate(batch.created_at)}</td>
                        <td style={s.td}>
                          <button
                            style={s.btnDelete}
                            onClick={() => handleDeleteBatch(batch.uuid)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === "settings" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Settings</h2>
            </div>

            <div style={s.formCard}>
              <h3 style={s.formTitle}>🔒 Change Password</h3>
              <p
                style={{
                  color: "#7a7a9a",
                  fontSize: 13,
                  marginBottom: 20,
                  marginTop: -8,
                }}
              >
                Update your super admin password.
              </p>

              <form onSubmit={handlePasswordChange} noValidate>
                <div style={{ maxWidth: 420 }}>
                  {/* Current Password */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Current Password *</label>
                    <div style={s.pwWrapper}>
                      <input
                        style={pwInp(pwErrors.currentPassword)}
                        type={showCurrentPw ? "text" : "password"}
                        value={pwForm.currentPassword}
                        onChange={(e) => {
                          setPwForm((p) => ({
                            ...p,
                            currentPassword: e.target.value,
                          }));
                          setPwErrors((p) => ({ ...p, currentPassword: "" }));
                        }}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        style={s.pwToggle}
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                      >
                        {showCurrentPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {pwErrors.currentPassword && (
                      <span style={s.fieldErr}>{pwErrors.currentPassword}</span>
                    )}
                  </div>

                  {/* New Password */}
                  <div style={s.formGroup}>
                    <label style={s.label}>New Password *</label>
                    <div style={s.pwWrapper}>
                      <input
                        style={pwInp(pwErrors.newPassword)}
                        type={showNewPw ? "text" : "password"}
                        value={pwForm.newPassword}
                        onChange={(e) => {
                          setPwForm((p) => ({
                            ...p,
                            newPassword: e.target.value,
                          }));
                          setPwErrors((p) => ({ ...p, newPassword: "" }));
                        }}
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        style={s.pwToggle}
                        onClick={() => setShowNewPw(!showNewPw)}
                      >
                        {showNewPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {pwErrors.newPassword && (
                      <span style={s.fieldErr}>{pwErrors.newPassword}</span>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div style={s.formGroup}>
                    <label style={s.label}>Confirm New Password *</label>
                    <div style={s.pwWrapper}>
                      <input
                        style={pwInp(pwErrors.confirmPassword)}
                        type={showConfirmPw ? "text" : "password"}
                        value={pwForm.confirmPassword}
                        onChange={(e) => {
                          setPwForm((p) => ({
                            ...p,
                            confirmPassword: e.target.value,
                          }));
                          setPwErrors((p) => ({ ...p, confirmPassword: "" }));
                        }}
                        placeholder="Repeat new password"
                      />
                      <button
                        type="button"
                        style={s.pwToggle}
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                      >
                        {showConfirmPw ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {pwErrors.confirmPassword && (
                      <span style={s.fieldErr}>{pwErrors.confirmPassword}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    style={s.btnPrimary}
                    disabled={pwLoading}
                  >
                    {pwLoading ? "Updating..." : "🔒 Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "N/A");
const pwInp = (err) => ({
  width: "100%",
  padding: "10px 44px 10px 13px",
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
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBrand: { display: "flex", alignItems: "center", gap: 12 },
  navLogo: {
    background: "white",
    color: "#2c3e93",
    fontWeight: 800,
    fontSize: 13,
    padding: "5px 10px",
    borderRadius: 6,
  },
  navTitle: { fontSize: 16, fontWeight: 600 },
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
  formCard: {
    background: "white",
    borderRadius: 12,
    padding: "24px 28px",
    marginBottom: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: 18,
    marginTop: 0,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  formGroup: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#7a7a9a",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 13px",
    border: "1.5px solid #e0e4f0",
    borderRadius: 7,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  formActions: { display: "flex", gap: 10, marginTop: 12 },
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
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  btnExpand: {
    background: "#f0f4ff",
    color: "#2c3e93",
    border: "1px solid #d0daff",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  btnDelete: {
    background: "#fdecea",
    color: "#c0392b",
    border: "1px solid #f5c6cb",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
  },
  loading: { textAlign: "center", padding: 40, color: "#7a7a9a" },
  empty: {
    textAlign: "center",
    padding: 40,
    color: "#7a7a9a",
    background: "white",
    borderRadius: 12,
  },
  centerList: { display: "flex", flexDirection: "column", gap: 14 },
  centerCard: {
    background: "white",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  centerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    flexWrap: "wrap",
    gap: 12,
  },
  centerInfo: { display: "flex", alignItems: "center", gap: 14 },
  centerName: { fontSize: 16, fontWeight: 700, color: "#1a1a2e" },
  centerFooter: { fontSize: 12, color: "#7a7a9a", marginTop: 3 },
  centerActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  userSection: {
    borderTop: "1px solid #f0f4ff",
    padding: "18px 22px",
    background: "#fafbff",
  },
  userSectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#2c3e93",
    marginBottom: 12,
    marginTop: 0,
  },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #e0e4f0",
  },
  userEmail: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
    marginRight: 10,
  },
  userRole: {
    fontSize: 11,
    background: "#eaf2ff",
    color: "#2c3e93",
    padding: "2px 8px",
    borderRadius: 20,
    fontWeight: 600,
  },
  userForm: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxWidth: 400,
  },
  tableWrapper: {
    background: "white",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
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
  pwWrapper: { position: "relative", display: "flex", alignItems: "center" },
  pwToggle: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 17,
    padding: "0 4px",
    color: "#7a7a9a",
    userSelect: "none",
  },
  fieldErr: { color: "#c0392b", fontSize: 12, marginTop: 4, display: "block" },
};

export default SuperAdminDashboard;

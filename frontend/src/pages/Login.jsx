import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if already logged in based on role
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (token) {
      if (user.role === "super_admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(formData.email, formData.password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>MDC</div>
          <h1 style={s.title}>Vaccination Card System</h1>
          <p style={s.sub}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              autoComplete="email"
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={s.footer}>Authorized personnel only</p>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e, #2c3e93, #c0392b)",
    padding: 20,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "44px 38px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
  },
  header: { textAlign: "center", marginBottom: 32 },
  logo: {
    width: 68,
    height: 68,
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    fontSize: 20,
    fontWeight: 800,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 4px 15px rgba(44,62,147,0.4)",
  },
  title: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" },
  sub: { fontSize: 13, color: "#7a7a9a", margin: 0 },
  group: { marginBottom: 18 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#7a7a9a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e0e4f0",
    borderRadius: 7,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  error: {
    background: "#fdecea",
    color: "#c0392b",
    border: "1px solid #f5c6cb",
    borderRadius: 7,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 14,
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    border: "none",
    borderRadius: 7,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#7a7a9a",
    fontSize: 12,
  },
};

export default Login;

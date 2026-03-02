import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
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
      if (data.user.role === "super_admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header — no logo */}
        <div style={s.header}>
          <h1 style={s.title}>Welcome Back</h1>
          <p style={s.sub}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={s.group}>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          {/* Password with toggle */}
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <div style={s.passwordWrapper}>
              <input
                style={s.passwordInput}
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                style={s.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
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
    background:
      "linear-gradient(135deg, #1a1a2e 0%, #2c3e93 50%, #c0392b 100%)",
    padding: 20,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: "44px 38px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
  },
  header: {
    textAlign: "center",
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: "#1a1a2e",
    margin: "0 0 8px",
    letterSpacing: "-0.3px",
  },
  sub: {
    fontSize: 14,
    color: "#7a7a9a",
    margin: 0,
  },
  group: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#7a7a9a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e0e4f0",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "12px 44px 12px 14px",
    border: "1.5px solid #e0e4f0",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  toggleBtn: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: "0 4px",
    lineHeight: 1,
    color: "#7a7a9a",
    userSelect: "none",
  },
  error: {
    background: "#fdecea",
    color: "#c0392b",
    border: "1px solid #f5c6cb",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #2c3e93, #1a237e)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    letterSpacing: "0.3px",
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    color: "#7a7a9a",
    fontSize: 12,
  },
};

export default Login;

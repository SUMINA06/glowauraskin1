import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import "../css/styles.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect if already logged in as regular user
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await apiClient.loginUser({
        email: form.email,
        password: form.password,
      });
      const apiPayload = response.data || response;
      const user = apiPayload?.data ?? apiPayload;
      const userRole = user?.role ?? apiPayload?.role;

      // Check user role and redirect accordingly
      if (userRole === "admin" || user.is_admin) {
        // Admin users should use admin login
        setError("Admin users must use the admin login page.");
        setSubmitting(false);
        return;
      }

      // Regular website user
      localStorage.setItem("user", JSON.stringify(user));
      const fromCheckout = location.state?.fromCheckout;
      navigate(fromCheckout ? "/checkout" : "/");
    } catch (err) {
      console.error("Login failed", err);
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="section page-hero muted">
        <div className="section-header">
          <h1>Login</h1>
          <p>Sign in to continue to checkout and manage your cart.</p>
        </div>
      </section>

      <section className="login-section">
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <form
            className="card contact-form"
            onSubmit={handleSubmit}
            style={{ maxWidth: 420, width: "100%" }}>
            <div className="card-tag">Welcome back</div>
            <h3>Login to Glowaura</h3>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p style={{ color: "red", fontSize: "0.85rem" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn primary full"
              disabled={submitting}>
              {submitting ? "Logging in..." : "Login"}
            </button>

            <p className="hint">
              Don&apos;t have an account?{" "}
              <Link to="/register">Register here</Link>.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;

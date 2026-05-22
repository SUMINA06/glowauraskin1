import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent admin users from accessing website register (if already logged in)
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      navigate("/admin/dashboard", { replace: true });
    }

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
      const res = await apiClient.createUser(form);
      const userId = res.data?.userId;

      if (!userId) {
        throw new Error("No userId returned from server");
      }

      const userRes = await apiClient.getUserById(userId);
      const user = userRes.data || userRes;

      // Clear admin session if somehow exists
      localStorage.removeItem("adminUser");
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/checkout");
    } catch (err) {
      console.error("Registration failed", err);
      setError("Registration failed. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="section page-hero muted">
        <div className="section-header">
          <h1>Create an Account</h1>
          <p>Register to save your details and make checkout faster.</p>
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
            style={{ maxWidth: 480, width: "100%" }}>
            <div className="card-tag">New here?</div>
            <h3>Register with Glowaura</h3>

            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Your username"
                value={form.username}
                onChange={handleChange}
              />
            </div>

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
                placeholder="Choose a password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+977-..."
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                placeholder="Street, city, district"
                value={form.address}
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
              {submitting ? "Registering..." : "Register"}
            </button>

            <p className="hint">
              Already have an account? <Link to="/login">Login here</Link>.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Register;

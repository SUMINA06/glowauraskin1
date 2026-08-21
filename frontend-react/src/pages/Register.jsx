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
    // If a normal customer is already logged in,
    // don't allow them to access the registration page.
    const user = localStorage.getItem("user");

    if (user) {
      navigate("/", { replace: true });
    }

    // IMPORTANT:
    // Do NOT check adminUser here.
    // Admin and customer sessions should remain independent.
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      // Basic validation
      if (!form.username.trim()) {
        throw new Error("Username is required.");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!form.password) {
        throw new Error("Password is required.");
      }

      if (form.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // Prepare clean data for backend
      const registrationData = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      console.log("Registering user:", registrationData);

      // CREATE USER
      const registerResponse = await apiClient.createUser(
        registrationData
      );

      console.log("Registration response:", registerResponse);

      // Handle different possible backend response formats
      const responseData =
        registerResponse?.data ?? registerResponse ?? {};

      const userId =
        responseData?.userId ??
        responseData?.id ??
        responseData?.user?.userId ??
        responseData?.user?.id ??
        responseData?.data?.userId ??
        responseData?.data?.id ??
        responseData?.data?.user?.userId ??
        responseData?.data?.user?.id;

      /*
       * We don't strictly require userId here.
       * Some backends successfully create the user but return
       * a different response structure.
       */

      console.log("Created user ID:", userId);

      // LOGIN AFTER SUCCESSFUL REGISTRATION
      const loginResponse = await apiClient.loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      console.log("Login response:", loginResponse);

      const loginData =
        loginResponse?.data ?? loginResponse ?? {};

      // Handle different possible login response structures
      const loggedInUser =
        loginData?.user ??
        loginData?.data?.user ??
        loginData?.data ??
        loginData;

      // Make sure we actually received something useful
      if (!loggedInUser) {
        throw new Error(
          "Registration succeeded, but automatic login failed."
        );
      }

      // IMPORTANT:
      // Do not remove adminUser here.
      // Admin session should not be affected by customer registration.
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Optional: save user ID if available
      if (userId) {
        localStorage.setItem("userId", String(userId));
      }

      // Registration + login successful
      navigate("/checkout", { replace: true });
    } catch (err) {
      console.error("Registration failed:", err);

      // Try to display backend error message
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message;

      setError(
        backendMessage ||
          err?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      {/* Page Header */}
      <section className="section page-hero muted">
        <div className="section-header">
          <h1>Create an Account</h1>
          <p>
            Register to save your details and make checkout faster.
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="login-section">
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "30px 15px",
          }}
        >
          <form
            className="card contact-form"
            onSubmit={handleSubmit}
            style={{
              maxWidth: 480,
              width: "100%",
            }}
          >
            <div className="card-tag">New here?</div>

            <h3>Register with Glowaura</h3>

            {/* Username */}
            <div className="field">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="Your username"
                value={form.username}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Email */}
            <div className="field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Choose a password"
                value={form.password}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Phone */}
            <div className="field">
              <label htmlFor="phone">
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+977-..."
                value={form.phone}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Address */}
            <div className="field">
              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                name="address"
                rows={3}
                autoComplete="street-address"
                placeholder="Street, city, district"
                value={form.address}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  color: "#d32f2f",
                  backgroundColor: "#ffebee",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  marginBottom: "15px",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn primary full"
              disabled={submitting}
            >
              {submitting
                ? "Creating Account..."
                : "Register"}
            </button>

            {/* Login Link */}
            <p className="hint">
              Already have an account?{" "}
              <Link to="/login">
                Login here
              </Link>
              .
            </p>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Register;
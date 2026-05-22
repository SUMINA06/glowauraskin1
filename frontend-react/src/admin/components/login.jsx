import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../api/client";
import "../css/forms.css";
import "../css/layout.css";

const LoginComponent = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // Admin login with JWT
      const response = await apiClient.adminLogin({ email, password });
      
      // The response should contain token and data
      const responseData = response.data;
      
      if (!responseData.token) {
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store admin token and user info in localStorage
      localStorage.setItem("adminToken", responseData.token);
      localStorage.setItem("adminUser", JSON.stringify(responseData.data));
      
      // Clear any regular user session
      localStorage.removeItem("user");

      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Username / Email</label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an admin account?{" "}
            <Link to="/admin/register">Register here</Link>
          </p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #e6e2cd 0%, #e6e2cd);
        }

        .login-card {
          background: var(--white);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          padding: 40px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 10px;
        }

        .login-header p {
          color: var(--text-light);
          font-size: 14px;
        }

        .login-error {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          border-left: 4px solid #dc2626;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-dark);
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group input:disabled {
          background-color: var(--light-bg);
          cursor: not-allowed;
        }

        .login-btn {
          width: 100%;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .login-btn:hover:not(:disabled) {
          background-color: rgb(255, 241, 168);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgb(255,241,168);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-footer {
          text-align: center;
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .login-footer p {
          color: var(--text-light);
          font-size: 13px;
          margin: 0;
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 20px;
            padding: 30px 20px;
          }

          .login-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginComponent;

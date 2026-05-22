import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../css/layout.css";
import "../css/style.css";
import "../css/sidebar.css";

const AdminLayout = ({ children, title }) => {
  const getNavLinkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active" : "");

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear both token and user data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h1>Glowaura Admin</h1>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/admin/dashboard" end className={getNavLinkClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/products" className={getNavLinkClass}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/orders" className={getNavLinkClass}>
                Orders
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users" className={getNavLinkClass}>
                Users
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/images" className={getNavLinkClass}>
                Images
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h2>{title || "Dashboard"}</h2>
          </div>
          <div className="top-bar-right">
            <span className="user-info">Admin</span>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;

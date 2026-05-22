import React, { useState, useEffect } from "react";
import apiClient from "../../api/client";
import AdminLayout from "../components/AdminLayout";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, usersRes, imagesRes, ordersRes] = await Promise.all([
        apiClient.getAllProducts(),
        apiClient.getAllUsers(),
        apiClient.getAllImages(),
        apiClient.getAllOrders(),
      ]);

      setStats({
        totalProducts: productsRes?.data ? productsRes.data.length : 0,
        totalUsers: usersRes?.data ? usersRes.data.length : 0,
        totalOrders: ordersRes?.data ? ordersRes.data.length : 0,
        totalImages: imagesRes?.data ? imagesRes.data.length : 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  return (
    <AdminLayout title="Dashboard">
      <div id="dashboard-page">
        <div className="page-header">
          <h2>Overview</h2>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon users-icon">👥</div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products-icon">📦</div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p className="stat-number">{stats.totalProducts}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon images-icon">🖼️</div>
            <div className="stat-info">
              <h3>Total Images</h3>
              <p className="stat-number">{stats.totalImages}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

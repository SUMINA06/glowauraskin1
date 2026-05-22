import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import apiClient from "../../api/client";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const response = await apiClient.verifyAdminToken();
        if (response.data?.success) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

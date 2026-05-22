import axios from "axios";

// Use environment variable when available, otherwise default to backend port 3000.
const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const API_BASE_URL = RAW_API_BASE_URL.endsWith("/api")
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL.replace(/\/$/, "")}/api`;

const API_ROOT = API_BASE_URL.replace(/\/api\/?$/, "");

// Helper function to get JWT token
const getAdminToken = () => {
  try {
    const adminData = localStorage.getItem("adminToken");
    return adminData ? adminData : null;
  } catch (error) {
    console.error("Error getting admin token:", error);
    return null;
  }
};

// Helper function to get JWT token from loginResponse
const saveAdminToken = (token) => {
  if (token) {
    localStorage.setItem("adminToken", token);
  }
};

// Create axios instance with default headers
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      // Optionally redirect to login page if using React Router
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

const apiClient = {
  // Product endpoints
  getAllProducts: async () => {
    try {
      const response = await axiosInstance.get(`/products`);
      // Backend returns { success, data, count } — normalize to return the inner data array when present
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  API_ROOT,

  // Cart endpoints
  getUserCart: async (userId) => {
    try {
      const response = await axiosInstance.get(`/cart/user/${userId}`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching user cart:", error);
      throw error;
    }
  },

  addCartItem: async (cartItem) => {
    try {
      const response = await axiosInstance.post(`/cart`, cartItem);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error adding cart item:", error);
      throw error;
    }
  },

  updateCartItem: async (id, updateData) => {
    try {
      const response = await axiosInstance.patch(`/cart/${id}`, updateData);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  },

  deleteCartItem: async (id) => {
    try {
      const response = await axiosInstance.delete(`/cart/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error deleting cart item:", error);
      throw error;
    }
  },

  clearUserCart: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/cart/user/${userId}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error clearing user cart:", error);
      throw error;
    }
  },

  checkStock: async (productId, quantity) => {
    try {
      const response = await axiosInstance.get(
        `/orders/stock/${productId}/${quantity}`,
      );
      return { data: response.data };
    } catch (error) {
      console.error("Error checking stock:", error);
      throw error;
    }
  },

  // Image endpoints
  getProductImages: async (productId) => {
    try {
      const response = await axiosInstance.get(
        `/images/product/${productId}`,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching images:", error);
      throw error;
    }
  },

  // User endpoints
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get(`/users`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  getUserByEmail: async (email) => {
    try {
      const response = await axiosInstance.get(
        `/users/email/${encodeURIComponent(email)}`,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post(`/users`, userData);
      return { data: response.data };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  loginUser: async (credentials) => {
    try {
      const response = await axiosInstance.post(`/users/login`, credentials);
      return { data: response.data };
    } catch (error) {
      console.error("Error logging in user:", error);
      throw error;
    }
  },

  adminLogin: async (credentials) => {
    try {
      const response = await axiosInstance.post(
        `/users/admin/login`,
        credentials,
      );
      // Save token if provided
      if (response.data?.token) {
        saveAdminToken(response.data.token);
      }
      return { data: response.data };
    } catch (error) {
      console.error("Error logging in admin:", error);
      throw error;
    }
  },

  verifyAdminToken: async () => {
    try {
      const response = await axiosInstance.get(`/users/admin/verify`);
      return { data: response.data };
    } catch (error) {
      console.error("Error verifying admin token:", error);
      throw error;
    }
  },

  adminRegister: async (userData) => {
    try {
      const response = await axiosInstance.post(
        `/users/admin/register`,
        userData,
      );
      return { data: response.data };
    } catch (error) {
      console.error("Error registering admin:", error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`/users/${id}`, userData);
      return { data: response.data };
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  createOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post(`/orders`, orderData);
      return { data: response.data };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Image collection
  getAllImages: async () => {
    try {
      const response = await axiosInstance.get(`/images`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching images list:", error);
      throw error;
    }
  },

  getImageById: async (id) => {
    try {
      const response = await axiosInstance.get(`/images/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error fetching image:", error);
      throw error;
    }
  },

  uploadImage: async (formData) => {
    try {
      const response = await axiosInstance.post(
        `/images/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return { data: response.data };
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  updateImage: async (id, imageData) => {
    try {
      const response = await axiosInstance.put(
        `/images/${id}`,
        imageData,
      );
      return { data: response.data };
    } catch (error) {
      console.error("Error updating image:", error);
      throw error;
    }
  },

  deleteImage: async (id) => {
    try {
      const response = await axiosInstance.delete(`/images/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  // Orders
  getAllOrders: async () => {
    try {
      const response = await axiosInstance.get(`/orders`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      // If orders endpoint is not implemented on backend, return empty list instead of throwing
      if (error?.response?.status === 404) {
        console.warn("Orders endpoint not found (404) — returning empty list");
        return { data: [] };
      }
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  getOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await axiosInstance.put(
        `/orders/${orderId}`,
        { status: statusData.order_status ?? statusData.status },
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const response = await axiosInstance.delete(`/orders/${orderId}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },

  // Product create/update/delete (supports optional image upload)
  createProduct: async (productData, imageFile = null) => {
    try {
      let response;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, value);
          }
        });
        fd.append("image", imageFile);

        response = await axiosInstance.post(`/products`, fd);
      } else {
        response = await axiosInstance.post(
          `/products`,
          productData,
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return { data: response.data };
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  updateProduct: async (id, productData, imageFile = null) => {
    try {
      let response;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            fd.append(key, value);
          }
        });
        fd.append("image", imageFile);

        response = await axiosInstance.put(`/products/${id}`, fd);
      } else {
        response = await axiosInstance.put(
          `/products/${id}`,
          productData,
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return { data: response.data };
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return { data: response.data };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Utility helpers
  API_ROOT,

  // Payment methods
  getPaymentConfig: async () => {
    try {
      const response = await axiosInstance.get(`/payment/config`);
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error fetching payment config:", error);
      throw error;
    }
  },

  // eSewa Payment
  initializeEsewa: async (paymentData) => {
    try {
      const response = await axiosInstance.post(
        `/payment/esewa/initialize`,
        paymentData,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error initializing eSewa:", error);
      throw error;
    }
  },

  verifyEsewa: async (data) => {
    try {
      const response = await axiosInstance.post(
        `/payment/esewa/verify`,
        { data },
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error verifying eSewa:", error);
      throw error;
    }
  },

  // Khalti Payment
  initializeKhalti: async (paymentData) => {
    try {
      const response = await axiosInstance.post(
        `/payment/khalti/initialize`,
        paymentData,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error initializing Khalti:", error);
      throw error;
    }
  },

  verifyKhalti: async (verificationData) => {
    try {
      const response = await axiosInstance.post(
        `/payment/khalti/verify`,
        verificationData,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error verifying Khalti:", error);
      throw error;
    }
  },

  // Cash on Delivery
  processCOD: async (orderData) => {
    try {
      const response = await axiosInstance.post(
        `/payment/cod/process`,
        orderData,
      );
      return { data: response.data?.data ?? response.data };
    } catch (error) {
      console.error("Error processing COD:", error);
      throw error;
    }
  },
};

export default apiClient;

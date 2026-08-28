import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const API_ROOT = API_BASE_URL.replace(/\/api\/?$/, "");

const resolveImageUrl = (path) => {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  const normalized = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_ROOT}${normalized}`;
};

// =====================================================
// ADMIN TOKEN
// =====================================================

const getAdminToken = () => {
  try {
    return (
      localStorage.getItem("adminToken") ||
      localStorage.getItem("userToken")
    );
  } catch (error) {
    console.error("Error getting admin token:", error);
    return null;
  }
};

const saveAdminToken = (token) => {
  if (token) {
    localStorage.setItem("adminToken", token);
  }
};

// =====================================================
// AXIOS INSTANCE
// =====================================================

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAdminToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }

    return Promise.reject(error);
  }
);

// =====================================================
// API CLIENT
// =====================================================

const apiClient = {
  API_ROOT,
  resolveImageUrl,

  // ===================================================
  // PRODUCTS
  // ===================================================

  getAllProducts: async () => {
    const response = await axiosInstance.get("/products");

    return {
      data: response.data?.data ?? response.data,
    };
  },

  getProductById: async (id) => {
    const response = await axiosInstance.get(
      `/products/${id}`
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  createProduct: async (
    productData,
    imageFile = null
  ) => {
    let response;

    if (imageFile) {
      const fd = new FormData();

      Object.entries(productData).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null
          ) {
            fd.append(key, value);
          }
        }
      );

      fd.append("image", imageFile);

      response = await axiosInstance.post(
        "/products",
        fd
      );
    } else {
      response = await axiosInstance.post(
        "/products",
        productData
      );
    }

    return {
      data: response.data,
    };
  },

  updateProduct: async (
    id,
    productData,
    imageFile = null
  ) => {
    let response;

    if (imageFile) {
      const fd = new FormData();

      Object.entries(productData).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null
          ) {
            fd.append(key, value);
          }
        }
      );

      fd.append("image", imageFile);

      response = await axiosInstance.put(
        `/products/${id}`,
        fd
      );
    } else {
      response = await axiosInstance.put(
        `/products/${id}`,
        productData
      );
    }

    return {
      data: response.data,
    };
  },

  deleteProduct: async (id) => {
    const response = await axiosInstance.delete(
      `/products/${id}`
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // CART
  // ===================================================

  getUserCart: async (userId) => {
    const response = await axiosInstance.get(
      `/cart/user/${userId}`
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  addCartItem: async (cartItem) => {
    const response = await axiosInstance.post(
      "/cart",
      cartItem
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  updateCartItem: async (id, updateData) => {
    const response = await axiosInstance.patch(
      `/cart/${id}`,
      updateData
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  deleteCartItem: async (id) => {
    const response = await axiosInstance.delete(
      `/cart/${id}`
    );

    return {
      data: response.data,
    };
  },

  clearUserCart: async (userId) => {
    const response = await axiosInstance.delete(
      `/cart/user/${userId}`
    );

    return {
      data: response.data,
    };
  },

  checkStock: async (productId, quantity) => {
    const response = await axiosInstance.get(
      `/orders/stock/${productId}/${quantity}`
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // USERS
  // ===================================================

  getAllUsers: async () => {
    const response = await axiosInstance.get(
      "/users"
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  getUserById: async (id) => {
    const response = await axiosInstance.get(
      `/users/${id}`
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  getUserByEmail: async (email) => {
    const response = await axiosInstance.get(
      `/users/email/${encodeURIComponent(email)}`
    );

    return {
      data: response.data?.data ?? response.data,
    };
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post(
      "/users",
      userData
    );

    return {
      data: response.data,
    };
  },

  loginUser: async (credentials) => {
    const response = await axiosInstance.post(
      "/users/login",
      credentials
    );

    if (response.data?.token) {
      localStorage.setItem("userToken", response.data.token);
    }

    return {
      data: response.data,
    };
  },

  updateUser: async (id, userData) => {
    const response = await axiosInstance.put(
      `/users/${id}`,
      userData
    );

    return {
      data: response.data,
    };
  },

  deleteUser: async (id) => {
    const response = await axiosInstance.delete(
      `/users/${id}`
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // ADMIN
  // ===================================================

  adminLogin: async (credentials) => {
    const response = await axiosInstance.post(
      "/users/admin/login",
      credentials
    );

    if (response.data?.token) {
      saveAdminToken(response.data.token);
    }

    return {
      data: response.data,
    };
  },

  verifyAdminToken: async () => {
    const response = await axiosInstance.get(
      "/users/admin/verify"
    );

    return {
      data: response.data,
    };
  },

  adminRegister: async (userData) => {
    const response = await axiosInstance.post(
      "/users/admin/register",
      userData
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // ORDERS
  // ===================================================

  createOrder: async (orderData) => {
    const response = await axiosInstance.post(
      "/orders",
      orderData
    );

    return {
      data: response.data,
    };
  },

  getAllOrders: async () => {
    const response = await axiosInstance.get(
      "/orders"
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  getOrderById: async (id) => {
    const response = await axiosInstance.get(
      `/orders/${id}`
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  uploadPaymentProof: async (orderId, file) => {
    const formData = new FormData();
    formData.append("paymentProof", file);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.id) formData.append("userId", String(user.id));
    } catch {
      // The backend still validates the order reference.
    }
    const response = await axiosInstance.post(
      `/orders/${orderId}/payment-proof`,
      formData,
    );

    return {
      data: response.data,
    };
  },

  updateOrderStatus: async (
    orderId,
    statusData
  ) => {
    const payload = {};
    const status = statusData.order_status ?? statusData.status;
    if (status !== undefined) payload.status = status;
    if (statusData.payment_status !== undefined) {
      payload.payment_status = statusData.payment_status;
    }
    if (statusData.paymentStatus !== undefined) {
      payload.paymentStatus = statusData.paymentStatus;
    }

    const response = await axiosInstance.put(
      `/orders/${orderId}`,
      payload
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  deleteOrder: async (orderId) => {
    const response = await axiosInstance.delete(
      `/orders/${orderId}`
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // IMAGES
  // ===================================================

  getProductImages: async (productId) => {
    const response = await axiosInstance.get(
      `/images/product/${productId}`
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  getAllImages: async () => {
    const response = await axiosInstance.get(
      "/images"
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  getImageById: async (id) => {
    const response = await axiosInstance.get(
      `/images/${id}`
    );

    return {
      data: response.data,
    };
  },

  uploadImage: async (formData) => {
    const response = await axiosInstance.post(
      "/images/upload",
      formData
    );

    return {
      data: response.data,
    };
  },

  updateImage: async (id, imageData) => {
    const response = await axiosInstance.put(
      `/images/${id}`,
      imageData
    );

    return {
      data: response.data,
    };
  },

  deleteImage: async (id) => {
    const response = await axiosInstance.delete(
      `/images/${id}`
    );

    return {
      data: response.data,
    };
  },

  // ===================================================
  // PAYMENT CONFIG
  // ===================================================

  getPaymentConfig: async () => {
    const response = await axiosInstance.get(
      "/payment/config"
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  // ===================================================
  // ESEWA
  // POST /api/payment/esewa/initialize
  // ===================================================

  initializeEsewa: async (paymentData) => {
    const response = await axiosInstance.post(
      "/payment/esewa/initialize",
      paymentData
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  // eSewa verification
  // GET /api/payment/esewa/verify
  verifyEsewa: async (data) => {
    const response = await axiosInstance.post(
      "/payment/esewa/verify",
      data
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  // ===================================================
  // KHALTI
  // POST /api/payment/khalti/initialize
  // ===================================================

  initializeKhalti: async (paymentData) => {
    const response = await axiosInstance.post(
      "/payment/khalti/initialize",
      paymentData
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  // Khalti verification
  // GET /api/payment/khalti/verify
  verifyKhalti: async (data) => {
    const response = await axiosInstance.post(
      "/payment/khalti/verify",
      data
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },

  // ===================================================
  // CASH ON DELIVERY
  // IMPORTANT:
  // Backend route = POST /payment/cod
  // NOT /payment/cod/process
  // ===================================================

  processCOD: async (orderData) => {
    const response = await axiosInstance.post(
      "/payment/cod",
      orderData
    );

    return {
      data:
        response.data?.data ??
        response.data,
    };
  },
};

export default apiClient;
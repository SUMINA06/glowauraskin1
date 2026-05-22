import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import apiClient from "../../api/client";
import "../css/tables.css";

const statusOptions = [
  "pending",
  "processing",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [selectedPaymentImage, setSelectedPaymentImage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllOrders();
      const orderList = response.data || [];
      console.debug("Loaded admin orders:", orderList);
      setOrders(orderList);
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const buildImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith("http") ? path : `${apiClient.API_ROOT}${path}`;
  };

  const openPaymentModal = (screenshotPath) => {
    const url = buildImageUrl(screenshotPath);
    if (!url) return;
    setSelectedPaymentImage(url);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentImage(null);
  };

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotificationType(type);
    window.setTimeout(() => setNotification(""), 4000);
  };

  const updateStatus = async (orderId, newStatus) => {
    setSaving(orderId);
    try {
      await apiClient.updateOrderStatus(orderId, { status: newStatus });
      showNotification("Order status updated successfully.", "success");
      await loadOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      showNotification("Unable to update order status.", "error");
    } finally {
      setSaving(null);
    }
  };

  const deleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Delete order ${orderNumber}? This cannot be undone.`)) {
      return;
    }

    setDeleting(orderId);
    try {
      await apiClient.deleteOrder(orderId);
      showNotification(`Order ${orderNumber} deleted successfully.`, "success");
      await loadOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      showNotification("Unable to delete order.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const renderItems = (orderItems) => {
    if (!orderItems || orderItems.length === 0) {
      return <div className="item-list-empty">No items</div>;
    }

    return orderItems.slice(0, 2).map((item) => {
      const imageUrl = item.image
        ? item.image.startsWith("http")
          ? item.image
          : `${apiClient.API_ROOT}${item.image}`
        : null;

      return (
        <div key={item.id} className="order-item-row">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="order-item-thumb"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="order-item-thumb-placeholder">-</div>
          )}
          <div className="order-item-meta">
            <strong>{item.name || "Unnamed product"}</strong>
            <small>
              Qty: {item.qty ?? item.quantity ?? 0} × Rs{item.price ?? 0}
            </small>
          </div>
        </div>
      );
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout title="Orders">
      <div id="orders-page">
        <div className="page-header">
          <h2>Orders Management</h2>
          <div className="header-stats">
            <span className="stat-badge">{orders.length} Total Orders</span>
          </div>
        </div>

        {notification && (
          <div className={`admin-notification notification-${notificationType}`}>
            {notification}
          </div>
        )}

        <div className="table-container">
          <table className="data-table" id="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="loading-spinner">Loading orders...</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "30px" }}>
                    <div className="empty-state">No orders found</div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td>
                      <span className="order-number">
                        {order.orderNumber || order.order_number || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.customerName || "Unknown"}</strong>
                        <small>{order.customerEmail || "No email"}</small>
                      </div>
                    </td>
                    <td>
                      <div className="items-preview">
                        {renderItems(order.orderItems)}
                        {order.orderItems?.length > 2 && (
                          <small className="more-items">
                            +{order.orderItems.length - 2} more
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="amount-cell">
                        <strong>Rs {order.totalPrice ?? order.total_amount ?? 0}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="payment-cell payment-cell-compact">
                        <div className="payment-method-badge">
                          {order.paymentMethod || order.payment_method || "N/A"}
                        </div>
                        {order.paymentScreenshot || order.payment_screenshot ? (
                          <button
                            type="button"
                            className="btn-payment-small"
                            onClick={() =>
                              openPaymentModal(
                                order.paymentScreenshot || order.payment_screenshot
                              )
                            }
                            title="Preview payment screenshot"
                          >
                            Payment Done
                          </button>
                        ) : (
                          <span className="payment-pending-small">Pending</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={order.status || order.orderStatus || order.order_status || "pending"}
                        onChange={(e) => updateStatus(order.id || order._id, e.target.value)}
                        disabled={saving === order.id || saving === order._id}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="date-cell">
                        {formatDate(order.createdAt || order.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() =>
                            deleteOrder(
                              order.id || order._id,
                              order.orderNumber || order.order_number
                            )
                          }
                          disabled={deleting === order.id || deleting === order._id}
                          title="Delete order"
                        >
                          {deleting === order.id || deleting === order._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPaymentModal && (
        <div className="modal-backdrop" onClick={closePaymentModal}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={closePaymentModal}
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="modal-body">
              {selectedPaymentImage && (
                <img
                  src={selectedPaymentImage}
                  alt="Payment Screenshot"
                  className="modal-image"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;

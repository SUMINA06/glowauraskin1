import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import apiClient from "../api/client";
import qrImage from "../images/qr.jpg";
import "../css/checkout.css";

const Checkout = () => {
  const { cart, getTotalPrice, clearCart } = useContext(CartContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();

  // Generate unique order ID
  const generateOrderId = () => {
    return `NM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Require login and prefill from saved user
  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      navigate("/login", { state: { fromCheckout: true } });
      return;
    }

    try {
      const user = JSON.parse(stored);

      setForm((prev) => ({
        ...prev,
        name: user.username || user.name || "",
        email: user.email || "",
        address: user.address || "",
        phone: user.phone || "",
      }));
    } catch {
      navigate("/login", { state: { fromCheckout: true } });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPaymentError(null);
  };

  const handleScreenshotChange = (e) => {
    setPaymentScreenshot(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cart.length) {
      alert("Your cart is empty. Add some items first.");
      return;
    }

    if (!paymentScreenshot) {
      setPaymentError("Please upload payment screenshot.");
      return;
    }

    setSubmitting(true);
    setPaymentError(null);

    try {
      // Check stock
      for (const item of cart) {
        const stockResponse = await apiClient.checkStock(
          item.id,
          item.qty || 1
        );

        if (!stockResponse.data.inStock) {
          setPaymentError(`Out of stock: ${item.name}`);
          setSubmitting(false);
          return;
        }
      }

      const orderId = generateOrderId();

      const formData = new FormData();

      formData.append("orderId", orderId);
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("address", form.address.trim());
      formData.append("shipping_address", form.address.trim());
      formData.append("totalAmount", getTotalPrice().toFixed(2));
      formData.append("payment_method", "qr");

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.id) {
          formData.append("userId", user.id);
        }
      }

      formData.append(
        "cart",
        JSON.stringify(
          cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
          })),
        ),
      );

      if (paymentScreenshot) {
        formData.append("paymentScreenshot", paymentScreenshot);
      }

      const response = await apiClient.createOrder(formData);
      const createdOrder = response?.data?.data ?? response?.data;

      // Success: clear cart, show success and redirect to shop
      clearCart();
      setOrderPlaced(true);
      const orderNumber = createdOrder?.orderNumber || createdOrder?.order_number || null;
      setNotification(
        orderNumber
          ? `Order placed successfully — ${orderNumber}`
          : "Order placed successfully"
      );

      // Redirect to shop after short delay
      setTimeout(() => {
        navigate("/shop");
      }, 2500);
    } catch (error) {
      console.error("Error placing order:", error);

      setPaymentError(
        error.response?.data?.message ||
          "Failed to place order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <main className="checkout-page">
        <section className="checkout-success">
          <div className="success-container">
            <div className="success-icon">✓</div>

            <h2>Order Placed Successfully!</h2>

            <p>
              Thank you for your purchase. Your order has been received.
            </p>

            <p className="order-id">
              Redirecting to shop in 3 seconds...
            </p>

            <Link to="/shop" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <div className="empty-container">
            <h2>Your Cart is Empty</h2>

            <p>Add some items to your cart before checking out.</p>

            <Link to="/shop" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-hero">
        <div className="section-header">
          <h1>Complete Your Order</h1>
          <p>Review your items and finalize checkout</p>
        </div>
      </section>

      <section className="checkout-content">
        <div className="checkout-wrapper">

          {/* Left Column */}
          <div className="checkout-form-column">

            <form onSubmit={handleSubmit} className="checkout-form">

              <h3 className="form-section-title">
                Delivery Information
              </h3>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="full name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="something@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="+977-9800000000"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Delivery Address</label>

                <textarea
                  id="address"
                  name="address"
                  placeholder="Street address, city, district, postal code"
                  rows="4"
                  value={form.address}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
              </div>

              {/* QR Payment Section */}
              <div className="payment-section">

                <h3 className="form-section-title">
                  QR Payment
                </h3>

                <div className="qr-payment-section">
                <div className="qr-card">
                  <h4>eSewa QR</h4>
                  <div className="qr-images">
                    <div className="qr-box">
                      <img
                        src={qrImage}
                        alt="eSewa QR"
                        className="qr-image"
                      />
                      <a
                        href="https://esewa.com.np/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="qr-link"
                      >
                    
                      </a>
                    </div>
                  </div>
                </div>

                <div className="qr-card">
                  <h4>Khalti QR</h4>
                  <div className="qr-images">
                    <div className="qr-box">
                      <img
                        src={qrImage}
                        alt="Khalti QR"
                        className="qr-image"
                      />
                      <a
                        href="https://khalti.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="qr-link"
                      >
                    
                      </a>
                    </div>
                  </div>
                </div>

                <div className="upload-payment">
                  <label htmlFor="paymentScreenshot">
                    Upload Payment Screenshot
                  </label>
                  <input
                    type="file"
                    id="paymentScreenshot"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    disabled={submitting}
                    required
                  />
                </div>
                </div>

                {paymentError && (
                  <div className="payment-error">
                    <span className="error-icon">⚠️</span>
                    <span>{paymentError}</span>
                  </div>
                )}

              </div>

              <button
                type="submit"
                className="btn-place-order"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  `Place Order - Rs ${getTotalPrice().toLocaleString()}`
                )}
              </button>

            </form>
          </div>

          {/* Right Column */}
          <div className="summary-column">

            <div className="order-summary-card">

              <h3 className="summary-title">
                Order Summary
              </h3>

              <div className="summary-items">

                {cart.map((item) => (
                  <div key={item.id} className="summary-item">

                    <div className="item-info">
                      <p className="item-name">
                        {item.name}
                      </p>

                      <p className="item-qty">
                        Qty: {item.qty || 1}
                      </p>
                    </div>

                    <p className="item-price">
                      Rs {(item.price * (item.qty || 1)).toLocaleString()}
                    </p>

                  </div>
                ))}

              </div>

              <div className="summary-divider"></div>

              <div className="summary-totals">

                <div className="total-row">
                  <span>Subtotal</span>
                  <span>
                    Rs {getTotalPrice().toLocaleString()}
                  </span>
                </div>

                <div className="total-row">
                  <span>Shipping</span>
                  <span className="free-shipping">
                    FREE
                  </span>
                </div>

                <div className="total-row">
                  <span>Tax</span>
                  <span>Rs 0</span>
                </div>

              </div>

              <div className="summary-divider"></div>

              <div className="total-row grand-total">
                <span>Total</span>

                <span>
                  Rs {getTotalPrice().toLocaleString()}
                </span>
              </div>

              <Link to="/cart" className="btn-edit-cart">
                ← Edit Cart
              </Link>

            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Checkout;
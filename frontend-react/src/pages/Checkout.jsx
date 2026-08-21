
import React, {
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import apiClient from "../api/client";
import qrImage from "../images/qr.jpg";

const Checkout = () => {
  const {
    cart,
    getTotalPrice,
    clearCart,
  } = useContext(CartContext);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [showQR, setShowQR] =
    useState(false);

  const [paymentScreenshot, setPaymentScreenshot] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [notification, setNotification] =
    useState("");

  // =====================================================
  // LOGIN + USER INFORMATION
  // =====================================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", {
        state: {
          fromCheckout: true,
        },
      });
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      setForm((previous) => ({
        ...previous,
        name:
          user.username ||
          user.name ||
          "",
        email:
          user.email || "",
        address:
          user.address || "",
        phone:
          user.phone || "",
      }));
    } catch (error) {
      console.error(
        "Invalid user data:",
        error
      );

      localStorage.removeItem("user");

      navigate("/login", {
        state: {
          fromCheckout: true,
        },
      });
    }
  }, [navigate]);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPaymentError("");
  };

  // =====================================================
  // PAYMENT METHOD
  // =====================================================

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    setPaymentError("");

    if (method === "qr") {
      setShowQR(true);
    } else {
      setShowQR(false);
    }

    if (method === "cod") {
      setPaymentScreenshot(null);
    }
  };

  // =====================================================
  // SCREENSHOT
  // =====================================================

  const handleScreenshotChange = (event) => {
    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPaymentScreenshot(null);
      setPaymentError(
        "Please upload a valid image file."
      );
      return;
    }

    setPaymentScreenshot(file);
    setPaymentError("");
  };

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  const getCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error(
        "Error reading user:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // CHECK STOCK
  // =====================================================

  const checkProductStock = async () => {
    for (const item of cart) {
      const quantity =
        Number(item.qty || 1);

      const response =
        await apiClient.checkStock(
          item.id,
          quantity
        );

      const stockData =
        response?.data;

      if (
        stockData &&
        stockData.inStock === false
      ) {
        throw new Error(
          `Out of stock: ${item.name}`
        );
      }
    }
  };

  // =====================================================
  // CREATE ORDER DATA
  // =====================================================

  const createOrderData = () => {
    const user =
      getCurrentUser();

    return {
      orderId: `GA-${Date.now()}`,

      userId:
        user?.id || null,

      customer_name:
        form.name.trim(),

      name:
        form.name.trim(),

      customer_email:
        form.email.trim(),

      email:
        form.email.trim(),

      customer_phone:
        form.phone.trim(),

      phone:
        form.phone.trim(),

      shipping_address:
        form.address.trim(),

      address:
        form.address.trim(),

      totalAmount:
        Number(getTotalPrice()),

      total_amount:
        Number(getTotalPrice()),

      payment_method:
        paymentMethod,

      cart: cart.map((item) => ({
        id: item.id,
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: Number(
          item.qty || 1
        ),
        quantity: Number(
          item.qty || 1
        ),
      })),

      items: cart.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(
          item.qty || 1
        ),
      })),
    };
  };

  // =====================================================
  // COD
  // =====================================================

  const processCODPayment = async () => {
    const orderData =
      createOrderData();

    const response =
      await apiClient.createOrder(
        orderData
      );

    return (
      response?.data?.data ||
      response?.data ||
      {}
    );
  };

  // =====================================================
  // ESEWA
  // =====================================================

  const processEsewaPayment = async () => {
    const orderData =
      createOrderData();

    const orderResponse = await apiClient.createOrder(orderData);
    const order =
      orderResponse?.data?.data ||
      orderResponse?.data ||
      {};

    const response =
      await apiClient.initializeEsewa(
        {
          ...orderData,
          amount: order.totalAmount || orderData.totalAmount,
          orderId: order.orderNumber || orderData.orderId,
        }
      );

    const result =
      response?.data?.data ||
      response?.data ||
      {};

    console.log(
      "eSewa response:",
      result
    );

    const gatewayUrl =
      result.payment_url ||
      result.paymentUrl;

    if (!gatewayUrl || !result.paymentData) {
      throw new Error(
        "eSewa payment form data was not returned by the server."
      );
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = gatewayUrl;
    form.style.display = "none";

    Object.entries(result.paymentData).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  // =====================================================
  // KHALTI
  // =====================================================

  const processKhaltiPayment = async () => {
    const orderData =
      createOrderData();

    const orderResponse = await apiClient.createOrder(orderData);
    const order =
      orderResponse?.data?.data ||
      orderResponse?.data ||
      {};

    const response =
      await apiClient.initializeKhalti(
        {
          ...orderData,
          amount: order.totalAmount || orderData.totalAmount,
          orderId: order.orderNumber || orderData.orderId,
          customerInfo: {
            name: orderData.name,
            email: orderData.email,
            phone: orderData.phone,
          },
          productName: orderData.cart?.[0]?.name,
        }
      );

    const result =
      response?.data?.data ||
      response?.data ||
      {};

    console.log(
      "Khalti response:",
      result
    );

    const gatewayUrl =
      result.payment_url ||
      result.paymentUrl ||
      result.url ||
      result.gateway_url ||
      result.gatewayUrl;

    if (!gatewayUrl) {
      throw new Error(
        "Khalti payment gateway URL was not returned by the server."
      );
    }

    window.location.href =
      gatewayUrl;
  };

  // =====================================================
  // QR PAYMENT
  // =====================================================

  const processQRPayment = async () => {
    if (!paymentScreenshot) {
      throw new Error(
        "Please upload your payment screenshot."
      );
    }

    const user =
      getCurrentUser();

    const orderId =
      `GA-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

    const formData =
      new FormData();

    formData.append(
      "orderId",
      orderId
    );

    if (user?.id) {
      formData.append(
        "userId",
        String(user.id)
      );
    }

    formData.append(
      "name",
      form.name.trim()
    );

    formData.append(
      "email",
      form.email.trim()
    );

    formData.append(
      "phone",
      form.phone.trim()
    );

    formData.append(
      "address",
      form.address.trim()
    );

    formData.append(
      "shipping_address",
      form.address.trim()
    );

    formData.append(
      "totalAmount",
      Number(
        getTotalPrice()
      ).toFixed(2)
    );

    formData.append(
      "payment_method",
      "qr"
    );

    formData.append(
      "cart",
      JSON.stringify(
        cart.map((item) => ({
          id: item.id,
          product_id: item.id,
          name: item.name,
          price: Number(item.price),
          qty: Number(
            item.qty || 1
          ),
          quantity: Number(
            item.qty || 1
          ),
        }))
      )
    );

    formData.append(
      "paymentScreenshot",
      paymentScreenshot
    );

    const response =
      await apiClient.createOrder(
        formData
      );

    return (
      response?.data?.data ||
      response?.data ||
      {}
    );
  };

  // =====================================================
  // HANDLE SUBMIT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setPaymentError("");

    // Cart validation
    if (
      !cart ||
      cart.length === 0
    ) {
      setPaymentError(
        "Your cart is empty. Add some items first."
      );
      return;
    }

    // Form validation
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim()
    ) {
      setPaymentError(
        "Please fill in all delivery information."
      );
      return;
    }

    // Payment validation
    if (!paymentMethod) {
      setPaymentError(
        "Please select a payment method."
      );
      return;
    }

    // QR screenshot validation
    if (
      paymentMethod === "qr" &&
      !paymentScreenshot
    ) {
      setPaymentError(
        "Please upload your payment screenshot."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Check stock
      await checkProductStock();

      // ===============================================
      // COD
      // ===============================================

      if (
        paymentMethod === "cod"
      ) {
        const result =
          await processCODPayment();

        console.log(
          "COD order response:",
          result
        );

        clearCart();

        const orderNumber =
          result.orderNumber ||
          result.order_number ||
          result.order?.orderNumber ||
          result.order?.order_number;

        setNotification(
          orderNumber
            ? `Order placed successfully - ${orderNumber}`
            : "Order placed successfully"
        );

        setOrderPlaced(true);

        setTimeout(() => {
          navigate("/shop");
        }, 2500);

        return;
      }

      // ===============================================
      // QR
      // ===============================================

      if (
        paymentMethod === "qr"
      ) {
        const result =
          await processQRPayment();

        console.log(
          "QR order response:",
          result
        );

        clearCart();

        const orderNumber =
          result.orderNumber ||
          result.order_number ||
          result.order?.orderNumber ||
          result.order?.order_number;

        setNotification(
          orderNumber
            ? `Order placed successfully - ${orderNumber}`
            : "Order placed successfully"
        );

        setOrderPlaced(true);

        setTimeout(() => {
          navigate("/shop");
        }, 2500);

        return;
      }

      // ===============================================
      // ESEWA
      // ===============================================

      if (
        paymentMethod === "esewa"
      ) {
        await processEsewaPayment();
        return;
      }

      // ===============================================
      // KHALTI
      // ===============================================

      if (
        paymentMethod === "khalti"
      ) {
        await processKhaltiPayment();
        return;
      }

      throw new Error(
        "Invalid payment method selected."
      );
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to place order. Please try again.";

      setPaymentError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (orderPlaced) {
    return (
      <>
        <style>{styles}</style>

        <main className="checkout-page">
          <section className="checkout-success">
            <div className="success-container">

              <div className="success-icon">
                ✓
              </div>

              <h2>
                Order Placed Successfully!
              </h2>

              <p>
                Thank you for your purchase.
                Your order has been received.
              </p>

              {notification && (
                <p className="order-id">
                  {notification}
                </p>
              )}

              <p className="order-id">
                Redirecting to shop in
                3 seconds...
              </p>

              <Link
                to="/shop"
                className="btn-primary"
              >
                Continue Shopping
              </Link>

            </div>
          </section>
        </main>
      </>
    );
  }

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (
    !cart ||
    cart.length === 0
  ) {
    return (
      <>
        <style>{styles}</style>

        <main className="checkout-page">
          <section className="checkout-empty">
            <div className="empty-container">

              <h2>
                Your Cart is Empty
              </h2>

              <p>
                Add some items to your cart
                before checking out.
              </p>

              <Link
                to="/shop"
                className="btn-primary"
              >
                Start Shopping
              </Link>

            </div>
          </section>
        </main>
      </>
    );
  }

  // =====================================================
  // MAIN CHECKOUT
  // =====================================================

  return (
    <>
      <style>{styles}</style>

      <main className="checkout-page">

        <section className="checkout-hero">
          <div className="section-header">

            <h1>
              Complete Your Order
            </h1>

            <p>
              Review your items and finalize
              checkout
            </p>

          </div>
        </section>

        <section className="checkout-content">

          <div className="checkout-wrapper">

            {/* LEFT COLUMN */}

            <div className="checkout-form-column">

              <form
                onSubmit={handleSubmit}
                className="checkout-form"
              >

                {/* DELIVERY */}

                <h3 className="form-section-title">
                  Delivery Information
                </h3>

                <div className="form-group">

                  <label htmlFor="name">
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  />

                </div>

                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="email">
                      Email Address
                    </label>

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

                    <label htmlFor="phone">
                      Phone Number
                    </label>

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

                  <label htmlFor="address">
                    Delivery Address
                  </label>

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

                {/* PAYMENT */}

                <div className="payment-section">

                  <h3 className="form-section-title">
                    Select Payment Method
                  </h3>

                  {/* COD */}

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod === "cod"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePaymentMethod("cod")
                    }
                    disabled={submitting}
                  >

                    <div className="payment-icon cod-icon">
                      💵
                    </div>

                    <div className="payment-info">

                      <span className="payment-title">
                        Cash on Delivery
                      </span>

                      <span className="payment-subtitle">
                        Pay when your order arrives
                      </span>

                    </div>

                    <div className="payment-arrow">
                      {paymentMethod ===
                      "cod"
                        ? "✓"
                        : "›"}
                    </div>

                  </button>

                  {/* ESEWA */}

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod ===
                      "esewa"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePaymentMethod(
                        "esewa"
                      )
                    }
                    disabled={submitting}
                  >

                    <div className="payment-icon esewa-icon">
                      e
                    </div>

                    <div className="payment-info">

                      <span className="payment-title">
                        eSewa
                      </span>

                      <span className="payment-subtitle">
                        Pay securely through eSewa
                      </span>

                    </div>

                    <div className="payment-arrow">
                      {paymentMethod ===
                      "esewa"
                        ? "✓"
                        : "›"}
                    </div>

                  </button>

                  {/* QR PAYMENT */}

                  <button
                    type="button"
                    className={`payment-method ${
                      paymentMethod === "qr"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handlePaymentMethod("qr")
                    }
                    disabled={submitting}
                  >

                    <div className="payment-icon qr-icon">
                      QR
                    </div>

                    <div className="payment-info">

                      <span className="payment-title">
                        QR Payment
                      </span>

                      <span className="payment-subtitle">
                        Scan QR to make payment
                      </span>

                    </div>

                    <div className="payment-arrow">
                      {paymentMethod ===
                      "qr"
                        ? "✓"
                        : "›"}
                    </div>

                  </button>

                  {/* QR DISPLAY */}

                  {showQR &&
                    paymentMethod === "qr" && (
                      <div className="qr-payment-display">

                        <h4>
                          Scan QR to Pay
                        </h4>

                        <p>
                          Scan the QR code using
                          your mobile wallet or
                          banking application.
                        </p>

                        <div className="qr-display-box">

                          <img
                            src={qrImage}
                            alt="Payment QR Code"
                            className="payment-qr-image"
                          />

                        </div>

                        <p className="qr-payment-note">
                          After completing payment,
                          upload your payment
                          screenshot below.
                        </p>

                      </div>
                    )}

                  {/* COD INFORMATION */}

                  {paymentMethod === "cod" && (
                    <div className="payment-instruction">

                      <strong>
                        Cash on Delivery
                      </strong>

                      <p>
                        Your order will be confirmed
                        immediately. Payment will be
                        collected when your order is
                        delivered.
                      </p>

                    </div>
                  )}

                  {/* ESEWA INFORMATION */}

                  {paymentMethod === "esewa" && (
                    <div className="payment-instruction">

                      <strong>
                        eSewa Payment
                      </strong>

                      <p>
                        Click Place Order to continue
                        to the eSewa payment gateway.
                        Your order will only be marked
                        as paid after successful
                        payment verification.
                      </p>

                    </div>
                  )}

                  {/* QR SCREENSHOT UPLOAD */}

                  {paymentMethod === "qr" && (
                    <div className="upload-payment">

                      <label htmlFor="paymentScreenshot">
                        Upload Payment Screenshot
                      </label>

                      <input
                        type="file"
                        id="paymentScreenshot"
                        accept="image/*"
                        onChange={
                          handleScreenshotChange
                        }
                        disabled={submitting}
                      />

                      {paymentScreenshot && (
                        <p className="selected-file">
                          ✓{" "}
                          {paymentScreenshot.name}
                        </p>
                      )}

                    </div>
                  )}

                  {/* ERROR */}

                  {paymentError && (
                    <div className="payment-error">

                      <span>
                        ⚠️
                      </span>

                      <span>
                        {paymentError}
                      </span>

                    </div>
                  )}

                </div>

                {/* PLACE ORDER */}

                <button
                  type="submit"
                  className="btn-place-order"
                  disabled={
                    submitting ||
                    !paymentMethod
                  }
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

            {/* RIGHT COLUMN */}

            <div className="summary-column">

              <div className="order-summary-card">

                <h3 className="summary-title">
                  Order Summary
                </h3>

                <div className="summary-items">

                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="summary-item"
                    >

                      <div className="item-info">

                        <p className="item-name">
                          {item.name}
                        </p>

                        <p className="item-qty">
                          Qty: {item.qty || 1}
                        </p>

                      </div>

                      <p className="item-price">
                        Rs{" "}
                        {(
                          Number(item.price) *
                          Number(
                            item.qty || 1
                          )
                        ).toLocaleString()}
                      </p>

                    </div>
                  ))}

                </div>

                <div className="summary-divider"></div>

                <div className="summary-totals">

                  <div className="total-row">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      Rs{" "}
                      {getTotalPrice().toLocaleString()}
                    </span>
                  </div>

                  <div className="total-row">
                    <span>
                      Shipping
                    </span>

                    <span className="free-shipping">
                      FREE
                    </span>
                  </div>

                  <div className="total-row">
                    <span>
                      Tax
                    </span>

                    <span>
                      Rs 0
                    </span>
                  </div>

                </div>

                <div className="summary-divider"></div>

                <div className="total-row grand-total">

                  <span>
                    Total
                  </span>

                  <span>
                    Rs{" "}
                    {getTotalPrice().toLocaleString()}
                  </span>

                </div>

                <Link
                  to="/cart"
                  className="btn-edit-cart"
                >
                  ← Edit Cart
                </Link>

              </div>

            </div>

          </div>

        </section>

      </main>
    </>
  );
};

// =====================================================
// CSS
// =====================================================

const styles = `

.checkout-page {
  width: 100%;
  min-height: 100vh;
  background: #f8f8f8;
}

.checkout-hero {
  padding: 45px 20px 35px;
  background: #fff;
}

.section-header {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header h1 {
  margin: 0 0 8px;
  font-size: 32px;
  color: #222;
}

.section-header p {
  margin: 0;
  color: #777;
}

.checkout-content {
  padding: 40px 20px;
}

.checkout-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 35px;
  align-items: start;
}

.checkout-form {
  background: #fff;
  padding: 30px;
  border-radius: 10px;
}

.form-section-title {
  margin: 0 0 20px;
  font-size: 21px;
  font-weight: 600;
  color: #222;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #ff6b9d;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

/* PAYMENT */

.payment-section {
  margin-top: 30px;
}

.payment-method {
  width: 100%;
  min-height: 78px;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 18px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.payment-method:hover {
  border-color: #ff6b9d;
}

.payment-method.active {
  border: 2px solid #ff6b9d;
  background: #fff8fb;
}

.payment-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  border-radius: 8px;
  background: #f1f4f6;
  font-size: 20px;
  font-weight: 700;
}

.cod-icon {
  background: #eaf5ff;
  font-size: 23px;
}

.esewa-icon {
  background: #e7f8ed;
  color: #48a868;
  border-radius: 50%;
  font-size: 30px;
}

.khalti-icon {
  background: #eee8ff;
  color: #5d35a6;
  font-size: 23px;
}

.qr-icon {
  background: #fff0f5;
  color: #ff6b9d;
  font-size: 16px;
}

.payment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.payment-title {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.payment-subtitle {
  font-size: 13px;
  color: #777;
}

.payment-arrow {
  margin-left: 10px;
  font-size: 30px;
  color: #5270a3;
}

.payment-method.active .payment-arrow {
  color: #ff6b9d;
  font-size: 21px;
  font-weight: 700;
}

/* PAYMENT INSTRUCTION */

.payment-instruction {
  margin: 15px 0;
  padding: 15px;
  background: #fff8fb;
  border-left: 4px solid #ff6b9d;
  border-radius: 5px;
}

.payment-instruction strong {
  display: block;
  margin-bottom: 6px;
  color: #222;
}

.payment-instruction p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* QR */

.qr-payment-display {
  margin: 15px 0;
  padding: 20px;
  background: #fff8fb;
  border: 1px solid #ffd6e4;
  border-radius: 8px;
  text-align: center;
}

.qr-payment-display h4 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #222;
}

.qr-payment-display > p {
  margin: 0 0 15px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.qr-display-box {
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  margin: 0 auto 15px;
  padding: 15px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.payment-qr-image {
  display: block;
  width: 250px;
  height: 250px;
  max-width: 100%;
  object-fit: contain;
}

.qr-payment-note {
  margin: 10px 0 0 !important;
  font-weight: 600;
}

/* UPLOAD */

.upload-payment {
  margin: 20px 0 10px;
  padding: 18px;
  background: #fafafa;
  border: 1px dashed #ff6b9d;
  border-radius: 8px;
}

.upload-payment label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.upload-payment input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
}

.selected-file {
  margin: 10px 0 0;
  color: #48a868;
  font-size: 13px;
  font-weight: 600;
}

/* ERROR */

.payment-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  padding: 12px 15px;
  background: #fff1f1;
  border: 1px solid #ffcaca;
  border-radius: 6px;
  color: #d32f2f;
  font-size: 14px;
}

/* BUTTON */

.btn-place-order {
  width: 100%;
  margin-top: 25px;
  padding: 15px;
  border: none;
  border-radius: 7px;
  background: #ff6b9d;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-place-order:hover {
  background: #ff528c;
}

.btn-place-order:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* SUMMARY */

.summary-column {
  position: sticky;
  top: 20px;
}

.order-summary-card {
  padding: 25px;
  background: #fff;
  border-radius: 10px;
}

.summary-title {
  margin: 0 0 20px;
  font-size: 21px;
  color: #222;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 0;
}

.item-name {
  margin: 0 0 5px;
  font-size: 14px;
  font-weight: 600;
}

.item-qty {
  margin: 0;
  font-size: 13px;
  color: #777;
}

.item-price {
  margin: 0;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
}

.summary-divider {
  height: 1px;
  margin: 15px 0;
  background: #eee;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin: 12px 0;
  font-size: 14px;
}

.free-shipping {
  color: #48a868;
  font-weight: 600;
}

.grand-total {
  font-size: 20px;
  font-weight: 700;
}

.btn-edit-cart {
  display: block;
  margin-top: 20px;
  padding: 12px;
  border: 1px solid #ff6b9d;
  border-radius: 6px;
  color: #ff6b9d;
  text-align: center;
  text-decoration: none;
}

.btn-edit-cart:hover {
  background: #ff6b9d;
  color: #fff;
}

/* SUCCESS */

.checkout-success,
.checkout-empty {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.success-container,
.empty-container {
  max-width: 500px;
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  text-align: center;
}

.success-icon {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #e7f8ed;
  color: #48a868;
  font-size: 40px;
  font-weight: 700;
}

.success-container h2,
.empty-container h2 {
  margin-bottom: 12px;
}

.success-container p,
.empty-container p {
  color: #777;
}

.order-id {
  font-size: 14px;
  font-weight: 600;
}

.btn-primary {
  display: inline-block;
  margin-top: 15px;
  padding: 12px 22px;
  background: #ff6b9d;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
}

.btn-primary:hover {
  background: #ff528c;
}

/* SPINNER */

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  margin-right: 8px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* MOBILE */

@media (max-width: 900px) {

  .checkout-wrapper {
    grid-template-columns: 1fr;
  }

  .summary-column {
    position: static;
  }
}

@media (max-width: 600px) {

  .checkout-content {
    padding: 20px 12px;
  }

  .checkout-form {
    padding: 20px 15px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .checkout-hero {
    padding: 30px 15px;
  }

  .section-header h1 {
    font-size: 26px;
  }

  .payment-method {
    min-height: 72px;
    padding: 10px 12px;
  }

  .payment-icon {
    width: 42px;
    height: 42px;
    min-width: 42px;
    margin-right: 11px;
  }

  .payment-title {
    font-size: 14px;
  }

  .payment-subtitle {
    font-size: 12px;
  }

  .payment-arrow {
    font-size: 27px;
  }

  .order-summary-card {
    padding: 20px 15px;
  }

  .payment-qr-image {
    width: 220px;
    height: 220px;
  }
}

`;

export default Checkout;


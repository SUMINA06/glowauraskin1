const db = require("../config/db");
const { Order } = require("../model/Order");
const { Payment } = require("../model/Payment");
const { Product } = require("../model/Product");
const { Cart } = require("../model/Cart");

const validOrderStatuses = [
  "pending",
  "processing",
  "paid",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const formatOrderPayload = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const firstRow = rows[0];

  const items = rows
    .filter((row) => row.item_id)
    .map((row) => ({
      id: row.item_id,
      product: row.product_id ? String(row.product_id) : null,
      name: row.product_name,
      image: row.item_image_url || null,
      qty: Number(row.quantity) || 0,
      price: Number(row.item_price) || 0,
      totalPrice: Number(row.item_total_price) || 0,
    }));

  return {
    id: firstRow.id,
    _id: String(firstRow.id),
    orderNumber: firstRow.order_number,
    user: firstRow.user_id
      ? {
          id: firstRow.user_id,
          name: firstRow.user_name || firstRow.customer_name,
          email: firstRow.user_email || firstRow.customer_email,
        }
      : null,
    customerName: firstRow.customer_name,
    customerEmail: firstRow.customer_email,
    customerPhone: firstRow.customer_phone,
    customerAddress: firstRow.customer_address,
    shippingAddress: firstRow.customer_address,
    subtotalAmount: Number(firstRow.subtotal_amount) || 0,
    taxAmount: Number(firstRow.tax_amount) || 0,
    deliveryCharge: Number(firstRow.delivery_charge) || 0,
    discountAmount: Number(firstRow.discount_amount) || 0,
    totalPrice: Number(firstRow.total_amount) || 0,
    paymentMethod: firstRow.payment_method,
    paymentStatus: firstRow.payment_status,
    status: firstRow.order_status,
    paymentScreenshot: firstRow.payment_screenshot,
    createdAt: firstRow.created_at ? new Date(firstRow.created_at).toISOString() : null,
    updatedAt: firstRow.updated_at ? new Date(firstRow.updated_at).toISOString() : null,
    orderItems: items,
  };
};

const formatOrdersPayload = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const orders = rows.reduce((acc, row) => {
    const orderId = row.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        id: row.id,
        _id: String(row.id),
        orderNumber: row.order_number,
        user: row.user_id
          ? {
              id: row.user_id,
              name: row.user_name || row.customer_name,
              email: row.user_email || row.customer_email,
            }
          : null,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        customerAddress: row.customer_address,
        subtotalAmount: Number(row.subtotal_amount) || 0,
        taxAmount: Number(row.tax_amount) || 0,
        deliveryCharge: Number(row.delivery_charge) || 0,
        discountAmount: Number(row.discount_amount) || 0,
        totalPrice: Number(row.total_amount) || 0,
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        status: row.order_status,
        paymentScreenshot: row.payment_screenshot,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        orderItems: [],
      };
    }

    if (row.item_id) {
      acc[orderId].orderItems.push({
        id: row.item_id,
        product: row.product_id ? String(row.product_id) : null,
        name: row.product_name,
        image: row.item_image_url || null,
        qty: Number(row.quantity) || 0,
        price: Number(row.item_price) || 0,
        totalPrice: Number(row.item_total_price) || 0,
      });
    }

    return acc;
  }, {});

  return Object.values(orders);
};

const checkStock = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const quantity = Number(req.params.quantity);

    if (!productId || Number.isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or quantity",
      });
    }

    const productRows = await Product.findById(productId);

    if (!productRows || productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      inStock: true,
      product: productRows[0],
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check stock",
      error: error.message,
    });
  }
};

const parseCartPayload = (cart) => {
  if (!cart) {
    return null;
  }

  if (Array.isArray(cart)) {
    return cart;
  }

  if (typeof cart !== "string") {
    return null;
  }

  const normalize = (value) => {
    let normalized = value.trim();
    normalized = normalized.replace(/^['"]|['"]$/g, "");
    normalized = normalized.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return normalized;
  };

  const candidates = [cart];
  let current = cart;

  for (let i = 0; i < 3; i += 1) {
    current = normalize(current);
    candidates.push(current);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === "string") {
        const maybeParsed = JSON.parse(parsed);
        if (Array.isArray(maybeParsed)) {
          return maybeParsed;
        }
      }
    } catch (error) {
      // continue trying other transformations
    }
  }

  // Fallback: try to extract a JSON array substring like [ ... ] and parse it
  try {
    const firstBracket = value.indexOf('[');
    const lastBracket = value.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const sub = value.slice(firstBracket, lastBracket + 1);
      const parsedSub = JSON.parse(sub);
      if (Array.isArray(parsedSub)) return parsedSub;
    }
  } catch (e) {
    // ignore
  }

  return null;
};

const createOrder = async (req, res) => {
  let {
    orderId,
    name,
    email,
    phone,
    address,
    totalAmount,
    cart,
    payment_method,
    userId,
    shipping_address,
  } = req.body;

  console.log("[createOrder] headers:", req.headers['content-type']);
  console.log("[createOrder] body fields:", {
    orderId,
    name,
    email,
    phone,
    address,
    totalAmount,
    cartType: typeof cart,
    cartSample: cart ? String(cart).slice(0, 200) : null,
    payment_method,
    userId,
    shipping_address,
  });
  console.log("[createOrder] raw cart:", cart);
  console.log("[createOrder] file:", req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, mimetype: req.file.mimetype, filename: req.file.filename, path: req.file.path } : null);

  try {
    cart = parseCartPayload(cart);

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart data is invalid or empty.",
      });
    }

    const subtotalAmount = Number(totalAmount);
    const deliveryAddress = (address || shipping_address || "").trim();

    if (
      !name ||
      !email ||
      !phone ||
      !deliveryAddress ||
      Number.isNaN(subtotalAmount) ||
      subtotalAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order data. Name, email, phone, address, total amount, and cart are required.",
      });
    }

    const paymentScreenshot = req.file
      ? `/uploads/payments/${req.file.filename}`
      : null;

    if (!paymentScreenshot) {
      return res.status(400).json({
        success: false,
        message: "Payment screenshot upload is required.",
      });
    }

    const parsedUserId = userId ? Number(userId) : null;
    const orderData = {
      order_number:
        orderId && typeof orderId === "string"
          ? orderId
          : `NM-${Date.now()}`,
      user_id: parsedUserId && !Number.isNaN(parsedUserId) ? parsedUserId : null,
      customer_name: name.trim(),
      customer_email: email.trim().toLowerCase(),
      customer_phone: phone.trim(),
      customer_address: deliveryAddress,
      subtotal_amount: subtotalAmount,
      tax_amount: 0,
      delivery_charge: 0,
      discount_amount: 0,
      total_amount: subtotalAmount,
      payment_method: payment_method || "qr",
      payment_status: "pending",
      order_status: "pending",
      payment_screenshot: paymentScreenshot,
    };

    const connection = await db.getConnection();
    let orderIdCreated = null;

    try {
      await connection.beginTransaction();

      const [orderResult] = await connection.query(
        "INSERT INTO orders SET ?",
        [orderData],
      );

      orderIdCreated = orderResult?.insertId;
      if (!orderIdCreated) {
        throw new Error("Unable to save order.");
      }

      const orderItems = cart.map((item) => {
        const quantity = Number(item.qty || item.quantity || 1);
        const price = Number(item.price) || 0;

        return [
          orderIdCreated,
          item.id || item.productId || null,
          item.name || item.product_name || item.title || "Product",
          price,
          quantity,
          price * quantity,
        ];
      });

      const insertItemsQuery =
        "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price) VALUES ?";
      await connection.query(insertItemsQuery, [orderItems]);

      // Prepare payment record
      const transactionId = req.body.transaction_id || `TX-${Date.now()}-${Math.random().toString(36).slice(2,9).toUpperCase()}`;
      const clientPaymentStatus = (req.body.payment_status || '').toLowerCase();
      let paymentStatus = 'pending';
      if (clientPaymentStatus && ['completed','pending','failed','cancelled'].includes(clientPaymentStatus)) {
        paymentStatus = clientPaymentStatus;
      } else if ((orderData.payment_method || '').toLowerCase() === 'cod') {
        paymentStatus = 'completed';
      }

      // Prevent duplicate payment records by transaction_id
      if (transactionId) {
        const existingPayment = await connection.query('SELECT id FROM payments WHERE transaction_id = ? LIMIT 1', [transactionId]);
        const existingRows = existingPayment && existingPayment[0] ? existingPayment[0] : [];
        if (Array.isArray(existingRows) && existingRows.length > 0) {
          // Duplicate transaction id; attach to order and continue
          await connection.query('UPDATE orders SET transaction_id = ?, payment_status = ? WHERE id = ?', [transactionId, paymentStatus, orderIdCreated]);
        } else {
          const paymentData = {
            order_id: orderIdCreated,
            transaction_id: transactionId,
            payment_method: orderData.payment_method,
            payment_status: paymentStatus,
            amount: Number(orderData.total_amount) || 0,
            gateway_response: req.body.gateway_response || null,
          };
          await connection.query('INSERT INTO payments SET ?', [paymentData]);
          await connection.query('UPDATE orders SET transaction_id = ?, payment_status = ? WHERE id = ?', [transactionId, paymentStatus, orderIdCreated]);
        }
      }

      // If payment is completed, mark order_status as 'paid'
      if (paymentStatus === 'completed') {
        await connection.query('UPDATE orders SET order_status = ? WHERE id = ?', ['paid', orderIdCreated]);
      }

      await connection.commit();
    } catch (innerError) {
      await connection.rollback();
      console.error("Order transaction failed:", innerError);
      return res.status(500).json({
        success: false,
        message: "Failed to save order transaction.",
        error: innerError.message,
      });
    } finally {
      connection.release();
    }

    if (orderData.user_id) {
      try {
        await Cart.clearByUserId(orderData.user_id);
      } catch (clearError) {
        console.warn("Unable to clear user cart after order:", clearError);
      }
    }

    const createdRows = await Order.findByIdWithItems(orderIdCreated);
    const createdOrder = Array.isArray(createdRows) && createdRows.length > 0
      ? formatOrderPayload(createdRows)
      : null;

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: createdOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const rows = await Order.findAllWithItems();
    return res.json({
      success: true,
      data: formatOrdersPayload(rows),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const rows = await Order.findByIdWithItems(orderId);
    const order = formatOrderPayload(rows);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status, order_status } = req.body;
    const selectedStatus = status || order_status;

    if (!orderId || !selectedStatus || !validOrderStatuses.includes(selectedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID or status",
      });
    }

    await Order.updateById(orderId, { order_status: selectedStatus });

    return res.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

const getOrdersByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const rows = await Order.findByUserIdWithItems(userId);
    return res.json({
      success: true,
      data: formatOrdersPayload(rows),
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Check if order exists
    const rows = await Order.findByIdWithItems(orderId);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Delete order items first (due to foreign key constraints)
    const deleteItemsQuery = "DELETE FROM order_items WHERE order_id = ?";
    const db = require("../config/db");
    await db.execute(deleteItemsQuery, [orderId]);

    // Delete the order
    const deleteOrderQuery = "DELETE FROM orders WHERE id = ?";
    const [deleteResult] = await db.execute(deleteOrderQuery, [orderId]);

    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete order",
      });
    }

    return res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  checkStock,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByUser,
  deleteOrder,
};
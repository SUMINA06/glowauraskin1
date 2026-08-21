const db = require("../config/db");
const { Order } = require("../model/Order");
const storage = require("../services/storage");

// ======================================================
// CHECK STOCK
// ======================================================
exports.checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.params;

    const qty = parseInt(quantity, 10);

    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or quantity",
      });
    }

    const [rows] = await db.query(
      "SELECT id, name, stock FROM products WHERE id = ? LIMIT 1",
      [productId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = rows[0];

    res.json({
      success: true,
      data: {
        productId: product.id,
        name: product.name,
        availableStock: Number(product.stock || 0),
        requestedQuantity: qty,
        inStock: Number(product.stock || 0) >= qty,
      },
    });
  } catch (error) {
    console.error("Check stock error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to check stock",
    });
  }
};

// ======================================================
// CREATE ORDER
// ======================================================
exports.createOrder = async (req, res) => {
  let connection;

  try {
    const {
      orderId,
      orderNumber,
      userId,
      name,
      email,
      phone,
      address,
      shipping_address,
      totalAmount,
      subtotalAmount,
      taxAmount,
      deliveryCharge,
      discountAmount,
      payment_method,
      paymentMethod,
      payment_status,
      paymentStatus,
      transaction_id,
      transactionId,
      payment_reference,
      paymentReference,
      payment_gateway_response,
      cart,
    } = req.body;

    // --------------------------------------------------
    // Validate customer information
    // --------------------------------------------------
    if (!name || !email || !phone || !(address || shipping_address)) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and address are required",
      });
    }

    // --------------------------------------------------
    // Validate cart
    // --------------------------------------------------
    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart is required",
      });
    }

    let cartItems;

    try {
      cartItems = typeof cart === "string" ? JSON.parse(cart) : cart;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart data",
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // --------------------------------------------------
    // Payment method
    // --------------------------------------------------
    const method = String(
      payment_method || paymentMethod || "cod"
    ).toLowerCase();

    const allowedMethods = ["qr", "esewa", "khalti", "cod"];

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // --------------------------------------------------
    // Payment status
    // --------------------------------------------------
    let finalPaymentStatus =
      payment_status || paymentStatus || "pending";

    finalPaymentStatus = String(finalPaymentStatus).toLowerCase();

    if (
      !["pending", "completed", "failed", "cancelled"].includes(
        finalPaymentStatus
      )
    ) {
      finalPaymentStatus = "pending";
    }

    // --------------------------------------------------
    // COD is automatically confirmed as an order,
    // but payment remains pending.
    // --------------------------------------------------
    if (method === "cod") {
      finalPaymentStatus = "pending";
    }

    // --------------------------------------------------
    // Get total amount
    // --------------------------------------------------
    const total =
      parseFloat(totalAmount) ||
      parseFloat(subtotalAmount) ||
      0;

    if (total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    // --------------------------------------------------
    // Generate order number
    // --------------------------------------------------
    let generatedOrderNumber =
      orderNumber ||
      orderId ||
      `NM-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

    // --------------------------------------------------
    // Get DB connection
    // --------------------------------------------------
    connection = await db.getConnection();

    await connection.beginTransaction();

    // --------------------------------------------------
    // Check stock and calculate total from database
    // --------------------------------------------------
    let calculatedSubtotal = 0;
    const preparedItems = [];

    for (const item of cartItems) {
      const productId = item.id || item.product_id;

      const quantity = parseInt(
        item.qty || item.quantity || 1,
        10
      );

      if (!productId || quantity <= 0) {
        throw new Error("Invalid product information in cart");
      }

      const [productRows] = await connection.query(
        "SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE",
        [productId]
      );

      if (!productRows.length) {
        throw new Error(`Product not found: ${productId}`);
      }

      const product = productRows[0];

      const availableStock = Number(product.stock || 0);

      if (availableStock < quantity) {
        throw new Error(
          `Out of stock: ${product.name}. Available stock: ${availableStock}`
        );
      }

      const price = parseFloat(product.price) || 0;

      const itemTotal = price * quantity;

      calculatedSubtotal += itemTotal;

      preparedItems.push({
        product_id: product.id,
        product_name: product.name,
        price,
        quantity,
        total_price: itemTotal,
      });
    }

    // --------------------------------------------------
    // Use calculated subtotal
    // --------------------------------------------------
    const subtotal = calculatedSubtotal;

    const tax = parseFloat(taxAmount) || 0;
    const delivery = parseFloat(deliveryCharge) || 0;
    const discount = parseFloat(discountAmount) || 0;

    const calculatedTotal =
      subtotal + tax + delivery - discount;

    // --------------------------------------------------
    // Prevent amount manipulation from frontend
    // --------------------------------------------------
    if (
      Math.abs(
        calculatedTotal - total
      ) > 0.01
    ) {
      console.warn(
        `Amount mismatch. Frontend: ${total}, Database calculation: ${calculatedTotal}`
      );
    }

    const finalTotal = calculatedTotal;

    // --------------------------------------------------
    // Create order
    // --------------------------------------------------
    const orderData = {
      order_number: generatedOrderNumber,

      user_id: userId ? parseInt(userId, 10) : null,

      customer_name: name.trim(),
      customer_email: email.trim(),
      customer_phone: phone.trim(),

      customer_address: (
        address ||
        shipping_address ||
        ""
      ).trim(),

      subtotal_amount: subtotal,
      tax_amount: tax,
      delivery_charge: delivery,
      discount_amount: discount,
      total_amount: finalTotal,

      payment_method: method,

      payment_status: finalPaymentStatus,

      // COD order is confirmed immediately.
      // Online payments remain pending until verification.
      order_status:
        method === "cod"
          ? "confirmed"
          : finalPaymentStatus === "completed"
          ? "paid"
          : "pending",

      payment_screenshot: null,

      transaction_id:
        transaction_id ||
        transactionId ||
        null,

      payment_gateway_response:
        payment_gateway_response
          ? typeof payment_gateway_response === "string"
            ? payment_gateway_response
            : JSON.stringify(payment_gateway_response)
          : null,
    };

    const [orderResult] = await connection.query(
      "INSERT INTO orders SET ?",
      [orderData]
    );

    const newOrderId = orderResult.insertId;

    if (req.file) {
      const uploadedImage = await storage.uploadImage({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        folder: "payment-screenshots",
      });

      await connection.query(
        "UPDATE orders SET payment_screenshot = ? WHERE id = ?",
        [uploadedImage.url, newOrderId]
      );
    }

    // --------------------------------------------------
    // Create order items
    // --------------------------------------------------
    for (const item of preparedItems) {
      await connection.query(
        `
        INSERT INTO order_items
        (
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          total_price
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          newOrderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.total_price,
        ]
      );

      if (method === "cod" || method === "qr") {
        await connection.query(
          `
          UPDATE products
          SET stock = stock - ?
          WHERE id = ? AND stock >= ?
          `,
          [
            item.quantity,
            item.product_id,
            item.quantity,
          ]
        );
      }
    }

    // --------------------------------------------------
    // Create payment record
    // --------------------------------------------------
    await connection.query(
      `
      INSERT INTO payments
      (
        order_id,
        transaction_id,
        payment_method,
        payment_status,
        amount,
        gateway_response
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        newOrderId,

        transaction_id ||
          transactionId ||
          null,

        method,

        finalPaymentStatus,

        finalTotal,

        payment_gateway_response
          ? typeof payment_gateway_response === "string"
            ? payment_gateway_response
            : JSON.stringify(payment_gateway_response)
          : null,
      ]
    );

    // --------------------------------------------------
    // Commit transaction
    // --------------------------------------------------
    await connection.commit();

    // --------------------------------------------------
    // Response
    // --------------------------------------------------
    return res.status(201).json({
      success: true,
      message:
        method === "cod"
          ? "Order placed successfully with Cash on Delivery"
          : "Order created successfully",

      data: {
        id: newOrderId,
        orderNumber: generatedOrderNumber,
        orderId: newOrderId,

        totalAmount: finalTotal,

        paymentMethod: method,
        paymentStatus: finalPaymentStatus,

        orderStatus:
          method === "cod"
            ? "confirmed"
            : finalPaymentStatus === "completed"
            ? "paid"
            : "pending",
      },
    });
  } catch (error) {
    // --------------------------------------------------
    // Rollback if something fails
    // --------------------------------------------------
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create order",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ======================================================
// GET ALL ORDERS
// ======================================================
exports.getAllOrders = async (req, res) => {
  try {
    const rows = await Order.findAllWithItems();

    const orders = groupOrders(rows);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// ======================================================
// GET SINGLE ORDER
// ======================================================
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await Order.findByIdWithItems(id);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orders = groupOrders(rows);

    res.json({
      success: true,
      data: orders[0],
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// ======================================================
// GET ORDERS BY USER
// ======================================================
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const rows =
      await Order.findByUserIdWithItems(userId);

    const orders = groupOrders(rows);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error(
      "Get user orders error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
    });
  }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment proof are required",
      });
    }

    const [orders] = await db.query(
      "SELECT id, user_id FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [orderId, orderId],
    );
    const order = orders[0];

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = String(req.user?.userId || req.body.userId) === String(order.user_id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const uploadedImage = await storage.uploadImage({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      folder: "payment-proofs",
    });

    await db.query(
      "UPDATE orders SET payment_screenshot = ? WHERE id = ?",
      [uploadedImage.url, order.id],
    );

    return res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: {
        orderId: order.id,
        paymentScreenshot: uploadedImage.url,
      },
    });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload payment proof",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE ORDER STATUS
// ======================================================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      order_status,
      status,
      payment_status,
      paymentStatus,
      transaction_id,
      transactionId,
    } = req.body;

    const updates = {};

    if (order_status || status) {
      updates.order_status =
        order_status || status;
    }

    if (payment_status || paymentStatus) {
      updates.payment_status =
        payment_status || paymentStatus;
    }

    if (
      transaction_id ||
      transactionId
    ) {
      updates.transaction_id =
        transaction_id ||
        transactionId;
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No update data provided",
      });
    }

    await Order.updateById(id, updates);

    res.json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
};

// ======================================================
// DELETE ORDER
// ======================================================
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM orders WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete order error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete order",
    });
  }
};

// ======================================================
// HELPER: GROUP ORDER ITEMS
// ======================================================
function groupOrders(rows) {
  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,

        orderNumber:
          row.order_number,

        order_number:
          row.order_number,

        userId:
          row.user_id,

        customerName:
          row.customer_name,

        customerEmail:
          row.customer_email,

        customerPhone:
          row.customer_phone,

        customerAddress:
          row.customer_address,

        subtotalAmount:
          Number(row.subtotal_amount || 0),

        taxAmount:
          Number(row.tax_amount || 0),

        deliveryCharge:
          Number(row.delivery_charge || 0),

        discountAmount:
          Number(row.discount_amount || 0),

        totalAmount:
          Number(row.total_amount || 0),

        paymentMethod:
          row.payment_method,

        paymentStatus:
          row.payment_method === "cod"
            ? "cod"
            : row.payment_status,

        orderStatus:
          row.order_status,

        paymentScreenshot:
          row.payment_screenshot,

        transactionId:
          row.transaction_id,

        paymentGatewayResponse:
          row.payment_gateway_response,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,

        items: [],
        orderItems: [],
      });
    }

    if (row.item_id) {
      const item = {
        id: row.item_id,

        productId:
          row.product_id,

        productName:
          row.product_name,

        price:
          Number(row.item_price || 0),

        quantity:
          Number(row.quantity || 0),

        totalPrice:
          Number(row.item_total_price || 0),

        image:
          row.item_image_url || null,
        name: row.product_name,
        qty: Number(row.quantity || 0),
        subtotal: Number(row.item_total_price || 0),
      };

      map.get(row.id).items.push(item);
      map.get(row.id).orderItems.push(item);
    }
  }

  return Array.from(map.values());
}
const crypto = require("crypto");
const db = require("../config/db");
const env = require("../config/env");

// ======================================================
// eSEWA CONFIGURATION
// ======================================================

const ESEWA_CONFIG = {
  merchantCode:
    process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",

  secretKey:
    process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",

  paymentUrl:
    process.env.ESEWA_ENV === "production"
      ? "https://epay.esewa.com.np/api/epay/main/v2/form"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",

  statusUrl:
    process.env.ESEWA_ENV === "production"
      ? "https://epay.esewa.com.np/api/epay/transaction/status/"
      : "https://rc.esewa.com.np/api/epay/transaction/status/",
};

// ======================================================
// KHALTI CONFIGURATION
// ======================================================

const KHALTI_CONFIG = {
  secretKey: process.env.KHALTI_SECRET_KEY,

  publicKey: process.env.KHALTI_PUBLIC_KEY,

  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://khalti.com/api/v2"
      : "https://dev.khalti.com/api/v2",
};

// ======================================================
// HELPER: GENERATE ESEWA SIGNATURE
// ======================================================

const generateEsewaSignature = (message) => {
  return crypto
    .createHmac("sha256", ESEWA_CONFIG.secretKey)
    .update(message)
    .digest("base64");
};

// ======================================================
// HELPER: UPDATE ORDER + PAYMENT
// ======================================================

const updatePaymentInDatabase = async ({
  orderNumber,
  paymentMethod,
  paymentStatus,
  transactionId = null,
  gatewayResponse = null,
}) => {
  if (!orderNumber) {
    throw new Error("Order number is required.");
  }

  // Find order
  const [orders] = await db.execute(
    `
    SELECT id, order_number, total_amount, payment_status
    FROM orders
    WHERE order_number = ?
    LIMIT 1
    `,
    [orderNumber]
  );

  if (!orders.length) {
    throw new Error(`Order not found: ${orderNumber}`);
  }

  const order = orders[0];

  const isAlreadyPaid =
    order.payment_status === "completed" ||
    order.payment_status === "paid";

  if (paymentStatus === "paid" && !isAlreadyPaid) {
    const [items] = await db.execute(
      `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = ?
      `,
      [order.id]
    );

    for (const item of items) {
      const [result] = await db.execute(
        `
        UPDATE products
        SET stock = stock - ?
        WHERE id = ? AND stock >= ?
        `,
        [item.quantity, item.product_id, item.quantity]
      );

      if (result.affectedRows !== 1) {
        throw new Error("Insufficient stock to complete payment.");
      }
    }
  }

  const databasePaymentStatus =
    paymentStatus === "paid" ? "completed" : paymentStatus;
  const databaseOrderStatus =
    paymentStatus === "paid" ? "paid" : null;

  // Update orders table
  await db.execute(
    `
    UPDATE orders
    SET
      payment_method = ?,
      payment_status = ?,
      order_status = COALESCE(?, order_status),
      transaction_id = ?,
      payment_gateway_response = ?
    WHERE id = ?
    `,
    [
      paymentMethod,
      databasePaymentStatus,
      databaseOrderStatus,
      transactionId,
      gatewayResponse
        ? JSON.stringify(gatewayResponse)
        : null,
      order.id,
    ]
  );

  // Check if payment record exists
  const [payments] = await db.execute(
    `
    SELECT id
    FROM payments
    WHERE order_id = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [order.id]
  );

  if (payments.length) {
    await db.execute(
      `
      UPDATE payments
      SET
        transaction_id = ?,
        payment_method = ?,
        payment_status = ?,
        gateway_response = ?
      WHERE id = ?
      `,
      [
        transactionId,
        paymentMethod,
        databasePaymentStatus,
        gatewayResponse
          ? JSON.stringify(gatewayResponse)
          : null,
        payments[0].id,
      ]
    );
  } else {
    await db.execute(
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
        order.id,
        transactionId,
        paymentMethod,
        paymentStatus === "paid"
          ? "completed"
          : paymentStatus,
        order.total_amount,
        gatewayResponse
          ? JSON.stringify(gatewayResponse)
          : null,
      ]
    );
  }

  return order;
};

// ======================================================
// HELPER: FIND ORDER
// ======================================================

const getOrderByNumber = async (orderNumber) => {
  const [rows] = await db.execute(
    `
    SELECT *
    FROM orders
    WHERE order_number = ?
    LIMIT 1
    `,
    [orderNumber]
  );

  return rows.length ? rows[0] : null;
};

// ======================================================
// ESEWA INITIALIZE
// ======================================================

exports.initializeEsewa = async (req, res) => {
  try {
    const {
      amount,
      orderId,
      productName,
    } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount and orderId are required.",
      });
    }

    const order = await getOrderByNumber(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const orderAmount = Number(order.total_amount);
    const requestedAmount = Number(amount);

    // IMPORTANT:
    // Do not trust amount from frontend.
    if (
      Number.isNaN(requestedAmount) ||
      requestedAmount !== orderAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match order amount.",
      });
    }

    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;

    const totalAmount =
      orderAmount +
      taxAmount +
      serviceCharge +
      deliveryCharge;
    const formattedTotalAmount = totalAmount.toFixed(2);

    // eSewa requires these fields in this order
    const signatureMessage =
      `total_amount=${formattedTotalAmount},` +
      `transaction_uuid=${order.order_number},` +
      `product_code=${ESEWA_CONFIG.merchantCode}`;

    const signature =
      generateEsewaSignature(signatureMessage);

    const frontendUrl =
      env.FRONTEND_URL ||
      "http://localhost:5173";
    const verificationUrl =
      `${frontendUrl}/api/payment/esewa/verify`;

    const paymentData = {
      amount: orderAmount.toFixed(2),
      tax_amount: taxAmount.toFixed(2),
      total_amount: formattedTotalAmount,

      transaction_uuid: order.order_number,

      product_code:
        ESEWA_CONFIG.merchantCode,

      product_service_charge:
        serviceCharge.toFixed(2),

      product_delivery_charge:
        deliveryCharge.toFixed(2),

      success_url:
        verificationUrl,

      failure_url:
        `${frontendUrl}/checkout?payment=failed`,

      signed_field_names:
        "total_amount,transaction_uuid,product_code",

      signature,
    };

    // Save that eSewa payment has started
    await updatePaymentInDatabase({
      orderNumber: order.order_number,
      paymentMethod: "esewa",
      paymentStatus: "pending",
      transactionId: order.order_number,
      gatewayResponse: {
        stage: "initialized",
        product_code:
          ESEWA_CONFIG.merchantCode,
      },
    });

    return res.json({
      success: true,

      data: {
        paymentUrl:
          ESEWA_CONFIG.paymentUrl,

        paymentData,
      },
    });
  } catch (error) {
    console.error(
      "eSewa initialization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to initialize eSewa payment.",
      error: error.message,
    });
  }
};

// ======================================================
// ESEWA VERIFY
// Supports both GET and POST
// ======================================================

exports.verifyEsewa = async (req, res) => {
  try {
    const data =
      req.body?.data ||
      req.query?.data;

    if (!data) {
      return res.status(400).json({
        success: false,
        message:
          "eSewa payment data is required.",
      });
    }

    // Decode Base64 response
    const decodedString =
      Buffer.from(
        data,
        "base64"
      ).toString("utf8");

    const decodedData =
      JSON.parse(decodedString);

    console.log(
      "eSewa callback:",
      decodedData
    );

    const {
      status,
      transaction_code,
      transaction_uuid,
      total_amount,
      product_code,
      signed_field_names,
      signature,
    } = decodedData;

    if (
      !transaction_uuid ||
      !total_amount ||
      !product_code ||
      !signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eSewa response.",
      });
    }

    // Make sure this is our merchant
    if (
      product_code !==
      ESEWA_CONFIG.merchantCode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eSewa merchant code.",
      });
    }

    // ==================================================
    // VERIFY SIGNATURE
    // ==================================================

    // eSewa signs the response over the same three fixed fields used to
    // sign the request (total_amount, transaction_uuid, product_code) —
    // NOT over the transaction's signed_field_names. Always build the
    // verification message from those three fields only.
    const signatureMessage =
      `total_amount=${decodedData.total_amount},` +
      `transaction_uuid=${decodedData.transaction_uuid},` +
      `product_code=${decodedData.product_code}`;

    const expectedSignature =
      generateEsewaSignature(
        signatureMessage
      );

    if (
      signature !== expectedSignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eSewa payment signature.",
      });
    }

    // ==================================================
    // FIND ORDER
    // ==================================================

    const order =
      await getOrderByNumber(
        transaction_uuid
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // Verify amount against database
    const expectedAmount =
      Number(order.total_amount);

    const paidAmount =
      Number(total_amount);

    if (
      Number.isNaN(paidAmount) ||
      paidAmount !== expectedAmount
    ) {
      await updatePaymentInDatabase({
        orderNumber:
          order.order_number,

        paymentMethod: "esewa",

        paymentStatus: "failed",

        transactionId:
          transaction_code ||
          transaction_uuid,

        gatewayResponse:
          decodedData,
      });

      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match order amount.",
      });
    }

    // ==================================================
    // SUCCESS
    // ==================================================

    if (status === "COMPLETE") {
      const statusUrl = new URL(ESEWA_CONFIG.statusUrl);
      statusUrl.search = new URLSearchParams({
        product_code: ESEWA_CONFIG.merchantCode,
        total_amount: expectedAmount.toFixed(2),
        transaction_uuid: order.order_number,
      }).toString();

      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();

      if (!statusResponse.ok || statusData.status !== "COMPLETE") {
        return res.redirect(
          `${env.FRONTEND_URL || "http://localhost:5173"}/checkout?payment=failed&order=${encodeURIComponent(order.order_number)}`
        );
      }

      await updatePaymentInDatabase({
        orderNumber:
          order.order_number,

        paymentMethod: "esewa",

        paymentStatus: "paid",

        transactionId:
          transaction_code ||
          transaction_uuid,

        gatewayResponse:
          decodedData,
      });

      return res.redirect(
        `${env.FRONTEND_URL || "http://localhost:5173"}/payment-success?order=${encodeURIComponent(order.order_number)}&amount=${encodeURIComponent(paidAmount.toFixed(2))}&status=Payment%20Done&method=eSewa`
      );
    }

    // ==================================================
    // FAILED / PENDING
    // ==================================================

    await updatePaymentInDatabase({
      orderNumber:
        order.order_number,

      paymentMethod: "esewa",

      paymentStatus: "pending",

      transactionId:
        transaction_code ||
        transaction_uuid,

      gatewayResponse:
        decodedData,
    });

    return res.redirect(
      `${env.FRONTEND_URL || "http://localhost:5173"}/checkout?payment=failed&order=${encodeURIComponent(order.order_number)}`
    );
  } catch (error) {
    console.error(
      "eSewa verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to verify eSewa payment.",
      error: error.message,
    });
  }
};

// ======================================================
// ESEWA STATUS CHECK
// ======================================================

exports.checkEsewaStatus = async (
  req,
  res
) => {
  try {
    const {
      orderId,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required.",
      });
    }

    const order =
      await getOrderByNumber(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const url =
      `${ESEWA_CONFIG.statusUrl}` +
      `?product_code=${encodeURIComponent(
        ESEWA_CONFIG.merchantCode
      )}` +
      `&total_amount=${encodeURIComponent(
        Number(order.total_amount).toFixed(2)
      )}` +
      `&transaction_uuid=${encodeURIComponent(
        order.order_number
      )}`;

    const response =
      await fetch(url);

    const data =
      await response.json();

    console.log(
      "eSewa status:",
      data
    );

    if (
      data.status === "COMPLETE"
    ) {
      await updatePaymentInDatabase({
        orderNumber:
          order.order_number,

        paymentMethod: "esewa",

        paymentStatus: "paid",

        transactionId:
          data.ref_id ||
          data.transaction_uuid,

        gatewayResponse:
          data,
      });
    }

    return res.json({
      success:
        data.status === "COMPLETE",

      data,
    });
  } catch (error) {
    console.error(
      "eSewa status check error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check eSewa payment status.",
      error: error.message,
    });
  }
};

// ======================================================
// KHALTI INITIALIZE
// ======================================================

exports.initializeKhalti = async (
  req,
  res
) => {
  try {
    if (!KHALTI_CONFIG.secretKey) {
      return res.status(503).json({
        success: false,
        message: "Khalti secret key is not configured.",
      });
    }
    const {
      amount,
      orderId,
      customerInfo,
      productName,
    } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Amount and orderId are required.",
      });
    }

    const order =
      await getOrderByNumber(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    const orderAmount =
      Number(order.total_amount);

    const requestedAmount =
      Number(amount);

    if (
      Number.isNaN(requestedAmount) ||
      requestedAmount !== orderAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment amount does not match order amount.",
      });
    }

    // Khalti amount is in paisa
    const amountInPaisa =
      Math.round(
        orderAmount * 100
      );

    const frontendUrl =
      env.FRONTEND_URL ||
      "http://localhost:5173";

    const payload = {
      return_url:
        `${frontendUrl}/payment/khalti/verify`,

      website_url:
        frontendUrl,

      amount:
        amountInPaisa,

      purchase_order_id:
        order.order_number,

      purchase_order_name:
        productName ||
        "GlowAura Order",

      customer_info: {
        name:
          customerInfo?.name ||
          order.customer_name ||
          "Customer",

        email:
          customerInfo?.email ||
          order.customer_email ||
          "",

        phone:
          customerInfo?.phone ||
          order.customer_phone ||
          "",
      },
    };

    const response =
      await fetch(
        `${KHALTI_CONFIG.baseUrl}/epayment/initiate/`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Key ${KHALTI_CONFIG.secretKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(payload),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          "Khalti initialization failed."
      );
    }

    // Save pidx temporarily
    await updatePaymentInDatabase({
      orderNumber:
        order.order_number,

      paymentMethod:
        "khalti",

      paymentStatus:
        "pending",

      transactionId:
        data.pidx,

      gatewayResponse:
        data,
    });

    return res.json({
      success: true,

      data: {
        paymentUrl:
          data.payment_url,

        pidx:
          data.pidx,

        orderId:
          order.order_number,
      },
    });
  } catch (error) {
    console.error(
      "Khalti initialization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to initialize Khalti payment.",
    });
  }
};

// ======================================================
// KHALTI VERIFY
// ======================================================

exports.verifyKhalti = async (
  req,
  res
) => {
  try {
    // Khalti returns these through GET
    // on the return URL.

    const pidx =
      req.body?.pidx ||
      req.query?.pidx;

    const callbackOrderId =
      req.body?.purchase_order_id ||
      req.query?.purchase_order_id;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message:
          "Khalti pidx is required.",
      });
    }

    // ==================================================
    // LOOKUP PAYMENT
    // ==================================================

    const response =
      await fetch(
        `${KHALTI_CONFIG.baseUrl}/epayment/lookup/`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Key ${KHALTI_CONFIG.secretKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              pidx,
            }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.message ||
          "Khalti verification failed."
      );
    }

    console.log(
      "Khalti lookup:",
      data
    );

    const orderNumber =
      data.purchase_order_id ||
      callbackOrderId;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Order number was not returned by Khalti.",
      });
    }

    const order =
      await getOrderByNumber(
        orderNumber
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // ==================================================
    // VERIFY AMOUNT
    // ==================================================

    const expectedAmount =
      Math.round(
        Number(order.total_amount) * 100
      );

    const khaltiAmount =
      Number(data.total_amount);

    if (
      Number.isNaN(khaltiAmount) ||
      khaltiAmount !== expectedAmount
    ) {
      await updatePaymentInDatabase({
        orderNumber:
          order.order_number,

        paymentMethod:
          "khalti",

        paymentStatus:
          "failed",

        transactionId:
          data.transaction_id ||
          pidx,

        gatewayResponse:
          data,
      });

      return res.status(400).json({
        success: false,
        message:
          "Khalti payment amount does not match order amount.",
      });
    }

    // ==================================================
    // COMPLETED
    // ==================================================

    if (
      data.status === "Completed"
    ) {
      await updatePaymentInDatabase({
        orderNumber:
          order.order_number,

        paymentMethod:
          "khalti",

        paymentStatus:
          "paid",

        transactionId:
          data.transaction_id ||
          pidx,

        gatewayResponse:
          data,
      });

      return res.redirect(
        `${env.FRONTEND_URL || "http://localhost:5173"}/payment-success?order=${encodeURIComponent(order.order_number)}&amount=${encodeURIComponent((khaltiAmount / 100).toFixed(2))}&status=Payment%20Done&method=Khalti`
      );
    }

    // ==================================================
    // OTHER STATUS
    // ==================================================

    let internalStatus =
      "pending";

    if (
      [
        "Expired",
        "User canceled",
        "Refunded",
        "Partially refunded",
      ].includes(data.status)
    ) {
      internalStatus =
        "failed";
    }

    await updatePaymentInDatabase({
      orderNumber:
        order.order_number,

      paymentMethod:
        "khalti",

      paymentStatus:
        internalStatus,

      transactionId:
        data.transaction_id ||
        pidx,

      gatewayResponse:
        data,
    });

    return res.json({
      success: false,

      message:
        `Khalti payment status: ${data.status}`,

      data: {
        orderId:
          order.order_number,

        status:
          data.status,
      },
    });
  } catch (error) {
    console.error(
      "Khalti verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to verify Khalti payment.",
    });
  }
};

// ======================================================
// CASH ON DELIVERY
// ======================================================

exports.processCOD = async (
  req,
  res
) => {
  try {
    const {
      orderId,
      amount,
    } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID and amount are required.",
      });
    }

    const order =
      await getOrderByNumber(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    // COD is NOT paid yet.
    await updatePaymentInDatabase({
      orderNumber:
        order.order_number,

      paymentMethod:
        "cod",

      paymentStatus:
        "pending",

      transactionId:
        null,

      gatewayResponse: {
        type: "cash_on_delivery",
      },
    });

    return res.json({
      success: true,

      data: {
        orderId:
          order.order_number,

        amount:
          Number(order.total_amount),

        paymentMethod:
          "cod",

        paymentStatus:
          "pending",

        message:
          "Order placed successfully. Payment will be collected on delivery.",
      },
    });
  } catch (error) {
    console.error(
      "COD processing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process Cash on Delivery order.",
    });
  }
};

// ======================================================
// PAYMENT CONFIG
// ======================================================

exports.getPaymentConfig = async (
  req,
  res
) => {
  try {
    return res.json({
      success: true,

      data: {
        esewa: {
          merchantCode:
            ESEWA_CONFIG.merchantCode,

          testMode:
            process.env.NODE_ENV !==
            "production",
        },

        khalti: {
          publicKey:
            KHALTI_CONFIG.publicKey,

          testMode:
            process.env.NODE_ENV !==
            "production",
        },

        cod: {
          enabled: true,
          minOrder: 0,
          maxOrder: 50000,
        },
      },
    });
  } catch (error) {
    console.error(
      "Error fetching payment config:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch payment configuration.",
    });
  }
};
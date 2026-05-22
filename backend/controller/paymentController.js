const crypto = require("crypto");

// eSewa Configuration
const ESEWA_CONFIG = {
  merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST", // Test merchant code
  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q", // Test secret key
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://esewa.com.np/epay/main"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  verifyUrl:
    process.env.NODE_ENV === "production"
      ? "https://esewa.com.np/epay/transrec"
      : "https://uat.esewa.com.np/epay/transrec",
};

// Khalti Configuration
const KHALTI_CONFIG = {
  secretKey:
    process.env.KHALTI_SECRET_KEY ||
    "test_secret_key_dc74e0fd57cb46cd93832aee0a507256", // Test key
  publicKey:
    process.env.KHALTI_PUBLIC_KEY ||
    "test_public_key_dc74e0fd57cb46cd93832aee0a390234",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://khalti.com/api/v2"
      : "https://a.khalti.com/api/v2",
};

// Generate eSewa signature
const generateEsewaSignature = (message) => {
  const hash = crypto
    .createHmac("sha256", ESEWA_CONFIG.secretKey)
    .update(message)
    .digest("base64");
  return hash;
};

// Initialize eSewa Payment
exports.initializeEsewa = async (req, res) => {
  try {
    const { amount, orderId, productName } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount and orderId are required",
      });
    }

    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;
    const totalAmount =
      parseFloat(amount) + taxAmount + serviceCharge + deliveryCharge;

    // Create signature message
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${orderId},product_code=${ESEWA_CONFIG.merchantCode}`;
    const signature = generateEsewaSignature(signatureMessage);

    // Frontend URL for callbacks
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const paymentData = {
      amount: amount.toString(),
      tax_amount: taxAmount.toString(),
      total_amount: totalAmount.toString(),
      transaction_uuid: orderId,
      product_code: ESEWA_CONFIG.merchantCode,
      product_service_charge: serviceCharge.toString(),
      product_delivery_charge: deliveryCharge.toString(),
      success_url: `${frontendUrl}/payment/esewa/success`,
      failure_url: `${frontendUrl}/payment/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    res.json({
      success: true,
      data: {
        paymentUrl: ESEWA_CONFIG.baseUrl,
        paymentData,
      },
    });
  } catch (error) {
    console.error("eSewa initialization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize eSewa payment",
    });
  }
};

// Verify eSewa Payment
exports.verifyEsewa = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Payment data is required",
      });
    }

    // Decode the base64 response from eSewa
    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    );

    // Verify the signature
    const message = `total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${ESEWA_CONFIG.merchantCode}`;
    const expectedSignature = generateEsewaSignature(message);

    if (decodedData.signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Payment verified successfully
    res.json({
      success: true,
      data: {
        transactionId: decodedData.transaction_uuid,
        amount: decodedData.total_amount,
        status: decodedData.status,
        refId: decodedData.ref_id,
      },
    });
  } catch (error) {
    console.error("eSewa verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify eSewa payment",
    });
  }
};

// Initialize Khalti Payment
exports.initializeKhalti = async (req, res) => {
  try {
    const { amount, orderId, customerInfo, productName } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount and orderId are required",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Amount should be in paisa (1 Rs = 100 paisa)
    const amountInPaisa = Math.round(parseFloat(amount) * 100);

    const payload = {
      return_url: `${frontendUrl}/payment/khalti/verify`,
      website_url: frontendUrl,
      amount: amountInPaisa,
      purchase_order_id: orderId,
      purchase_order_name: productName || "NepMart Order",
      customer_info: {
        name: customerInfo?.name || "Customer",
        email: customerInfo?.email || "",
        phone: customerInfo?.phone || "",
      },
    };

    // Make request to Khalti API
    const response = await fetch(
      `${KHALTI_CONFIG.baseUrl}/epayment/initiate/`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Khalti initialization failed");
    }

    res.json({
      success: true,
      data: {
        paymentUrl: data.payment_url,
        pidx: data.pidx,
      },
    });
  } catch (error) {
    console.error("Khalti initialization error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize Khalti payment",
    });
  }
};

// Verify Khalti Payment
exports.verifyKhalti = async (req, res) => {
  try {
    const { pidx, txnId, amount, orderId } = req.body;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: "Payment ID (pidx) is required",
      });
    }

    // Lookup the payment status
    const response = await fetch(`${KHALTI_CONFIG.baseUrl}/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${KHALTI_CONFIG.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Khalti verification failed");
    }

    // Check payment status
    if (data.status === "Completed") {
      res.json({
        success: true,
        data: {
          status: "completed",
          transactionId: data.transaction_id,
          amount: data.total_amount / 100, // Convert from paisa to Rs
          orderId: data.purchase_order_id,
          fee: data.fee / 100,
        },
      });
    } else {
      res.json({
        success: false,
        message: `Payment status: ${data.status}`,
        data: { status: data.status },
      });
    }
  } catch (error) {
    console.error("Khalti verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify Khalti payment",
    });
  }
};

// Process Cash on Delivery
exports.processCOD = async (req, res) => {
  try {
    const { orderId, amount, customerInfo } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID and amount are required",
      });
    }

    // For COD, we just confirm the order with pending payment status
    res.json({
      success: true,
      data: {
        orderId,
        amount,
        paymentMethod: "cod",
        paymentStatus: "pending",
        message:
          "Order placed successfully. Payment will be collected on delivery.",
      },
    });
  } catch (error) {
    console.error("COD processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process Cash on Delivery order",
    });
  }
};

// Get payment configuration (public keys for frontend)
exports.getPaymentConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        esewa: {
          merchantCode: ESEWA_CONFIG.merchantCode,
          testMode: process.env.NODE_ENV !== "production",
        },
        khalti: {
          publicKey: KHALTI_CONFIG.publicKey,
          testMode: process.env.NODE_ENV !== "production",
        },
        cod: {
          enabled: true,
          minOrder: 0,
          maxOrder: 50000,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment configuration",
    });
  }
};

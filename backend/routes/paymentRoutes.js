const express = require("express");

const router = express.Router();

const paymentController = require("../controller/paymentController");

// =====================================================
// PAYMENT CONFIG
// =====================================================

router.get(
  "/config",
  paymentController.getPaymentConfig
);

// =====================================================
// ESEWA
// =====================================================

router.post(
  "/esewa/initialize",
  paymentController.initializeEsewa
);

router.all(
  "/esewa/verify",
  paymentController.verifyEsewa
);

// =====================================================
// KHALTI
// =====================================================

router.post(
  "/khalti/initialize",
  paymentController.initializeKhalti
);

router.all(
  "/khalti/verify",
  paymentController.verifyKhalti
);

// =====================================================
// CASH ON DELIVERY
// =====================================================

router.post(
  "/cod",
  paymentController.processCOD
);

module.exports = router;
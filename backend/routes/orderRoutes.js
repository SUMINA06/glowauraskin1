const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

const orderController = require("../controller/orderController");

const {
  authMiddleware,
  adminMiddleware,
} = require("../config/jwt");

const allowSelfOrAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  if (req.user && String(req.user.userId) === String(req.params.userId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
};

// ==========================
// TEST ROUTE
// ==========================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order route is working",
  });
});

// ==========================
// CHECK STOCK
// ==========================

router.get(
  "/stock/:productId/:quantity",
  orderController.checkStock
);

// ==========================
// CREATE ORDER
// ==========================

router.post(
  "/",
  upload.single("paymentScreenshot"),
  orderController.createOrder
);

// ==========================
// ADMIN ROUTES
// ==========================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderController.getOrderById
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderController.updateOrderStatus
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  orderController.updateOrderStatus
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderController.deleteOrder
);

// ==========================
// USER ORDERS
// ==========================

router.get(
  "/user/:userId",
  authMiddleware,
  allowSelfOrAdmin,
  orderController.getOrdersByUser
);

module.exports = router;
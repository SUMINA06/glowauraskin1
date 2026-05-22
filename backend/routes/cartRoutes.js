const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");

router.get("/user/:userId", cartController.getCartByUser);
router.post("/", cartController.addOrUpdateCartItem);
router.patch("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.deleteCartItem);
router.delete("/user/:userId", cartController.clearCartByUser);

module.exports = router;
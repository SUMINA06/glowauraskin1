const { Cart } = require("../model/Cart");

const getCartByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const items = await Cart.findByUserId(userId);
    return res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart items",
      error: error.message,
    });
  }
};

const addOrUpdateCartItem = async (req, res) => {
  try {
    const {
      userId,
      productId,
      name,
      price,
      quantity,
      imageUrl,
    } = req.body;

    const parsedUserId = Number(userId);
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity) || 1;
    const parsedPrice = Number(price) || 0;

    if (
      !parsedUserId ||
      Number.isNaN(parsedUserId) ||
      !parsedProductId ||
      Number.isNaN(parsedProductId) ||
      !name ||
      parsedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All cart item fields are required and must be valid",
      });
    }

    const item = {
      user_id: parsedUserId,
      product_id: parsedProductId,
      product_name: name,
      price: parsedPrice,
      quantity: parsedQuantity,
      image_url: imageUrl || null,
    };

    const result = await Cart.addOrUpdateItem(item);

    return res.status(201).json({
      success: true,
      message: "Cart item saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error saving cart item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save cart item",
      error: error.message,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!id || Number.isNaN(id) || Number.isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID or quantity",
      });
    }

    await Cart.updateQuantity(id, quantity);

    return res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message,
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID",
      });
    }

    await Cart.deleteItem(id);

    return res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete cart item",
      error: error.message,
    });
  }
};

const clearCartByUser = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    await Cart.clearByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};

module.exports = {
  getCartByUser,
  addOrUpdateCartItem,
  updateCartItem,
  deleteCartItem,
  clearCartByUser,
};
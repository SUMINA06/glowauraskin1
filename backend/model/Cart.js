const db = require("../config/db");

const cartTableQuery = `
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)`;

const createCartTable = async () => {
  try {
    await db.query(cartTableQuery);
    console.log("Cart items table created or already exists");
  } catch (err) {
    console.error("Error creating cart_items table:", err);
  }
};

const Cart = {
  findByUserId: async (userId) => {
    const query = "SELECT * FROM cart_items WHERE user_id = ? ORDER BY updated_at DESC";
    const [rows] = await db.query(query, [userId]);
    return rows;
  },

  findByUserIdAndProductId: async (userId, productId) => {
    const query = "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? LIMIT 1";
    const [rows] = await db.query(query, [userId, productId]);
    return rows[0] || null;
  },

  addOrUpdateItem: async (item) => {
    const existingItem = await Cart.findByUserIdAndProductId(item.user_id, item.product_id);

    if (existingItem) {
      const updatedQuantity = Math.max(1, existingItem.quantity + item.quantity);
      const query = "UPDATE cart_items SET quantity = ?, price = ?, product_name = ?, image_url = ? WHERE id = ?";
      await db.query(query, [updatedQuantity, item.price, item.product_name, item.image_url, existingItem.id]);
      return { ...existingItem, quantity: updatedQuantity, price: item.price, product_name: item.product_name, image_url: item.image_url };
    }

    const query = `INSERT INTO cart_items
      (user_id, product_id, product_name, price, quantity, image_url)
      VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(query, [
      item.user_id,
      item.product_id,
      item.product_name,
      item.price,
      item.quantity,
      item.image_url,
    ]);

    return {
      id: result.insertId,
      ...item,
    };
  },

  updateQuantity: async (id, quantity) => {
    if (quantity <= 0) {
      return Cart.deleteItem(id);
    }
    const query = "UPDATE cart_items SET quantity = ? WHERE id = ?";
    return await db.query(query, [quantity, id]);
  },

  deleteItem: async (id) => {
    const query = "DELETE FROM cart_items WHERE id = ?";
    return await db.query(query, [id]);
  },

  clearByUserId: async (userId) => {
    const query = "DELETE FROM cart_items WHERE user_id = ?";
    return await db.query(query, [userId]);
  },
};

module.exports = { Cart, createCartTable };
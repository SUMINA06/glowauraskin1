const db = require("../config/db");

const orderTableQuery = `
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(100) NOT NULL UNIQUE,
  user_id INT,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_address TEXT NOT NULL,
  subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method ENUM('qr', 'esewa', 'khalti', 'cod') NOT NULL DEFAULT 'qr',
  payment_status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  order_status ENUM('pending', 'processing', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_screenshot TEXT,
  transaction_id VARCHAR(255),
  payment_gateway_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_order_number (order_number),
  INDEX idx_payment_status (payment_status),
  INDEX idx_order_status (order_status),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
)`;

const orderItemsTableQuery = `
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
)`;

const createOrderTable = async () => {
  try {
    await db.query(orderTableQuery);
    console.log("Orders table created or already exists");
  } catch (err) {
    console.error("Error creating orders table:", err);
  }
};

const createOrderItemsTable = async () => {
  try {
    await db.query(orderItemsTableQuery);
    console.log("Order items table created or already exists");
  } catch (err) {
    console.error("Error creating order_items table:", err);
  }
};

const Order = {
  create: async (orderData) => {
    const query = "INSERT INTO orders SET ?";
    return await db.query(query, [orderData]);
  },

  createItems: async (items) => {
    if (!items || items.length === 0) {
      return [];
    }

    const values = items.map((item) => [
      item.order_id,
      item.product_id || null,
      item.product_name,
      item.price,
      item.quantity,
      item.total_price,
    ]);

    const query = `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price) VALUES ?`;
    return await db.query(query, [values]);
  },

  findByIdWithItems: async (id) => {
    const query = `
      SELECT
        o.*,
        u.id AS user_id,
        u.username AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.address AS user_address,
        oi.id AS item_id,
        oi.product_id,
        oi.product_name,
        oi.price AS item_price,
        oi.quantity,
        COALESCE(oi.total_price, oi.quantity * oi.price) AS item_total_price,
        img.image_path AS item_image_url
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN images img ON img.id = (
        SELECT i.id FROM images i WHERE i.product_id = oi.product_id ORDER BY i.created_at DESC LIMIT 1
      )
      WHERE o.id = ?
      ORDER BY oi.id ASC
    `;
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  findAllWithItems: async () => {
    const query = `
      SELECT
        o.*,
        u.id AS user_id,
        u.username AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.address AS user_address,
        oi.id AS item_id,
        oi.product_id,
        oi.product_name,
        oi.price AS item_price,
        oi.quantity,
        COALESCE(oi.total_price, oi.quantity * oi.price) AS item_total_price,
        img.image_path AS item_image_url
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN images img ON img.id = (
        SELECT i.id FROM images i WHERE i.product_id = oi.product_id ORDER BY i.created_at DESC LIMIT 1
      )
      ORDER BY o.created_at DESC, oi.id ASC
    `;
    const [rows] = await db.query(query);
    return rows;
  },

  findByUserIdWithItems: async (userId) => {
    const query = `
      SELECT
        o.*,
        u.id AS user_id,
        u.username AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        u.address AS user_address,
        oi.id AS item_id,
        oi.product_id,
        oi.product_name,
        oi.price AS item_price,
        oi.quantity,
        COALESCE(oi.total_price, oi.quantity * oi.price) AS item_total_price,
        img.image_path AS item_image_url
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN images img ON img.id = (
        SELECT i.id FROM images i WHERE i.product_id = oi.product_id ORDER BY i.created_at DESC LIMIT 1
      )
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, oi.id ASC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  },

  findByOrderNumber: async (orderNumber) => {
    const query = "SELECT * FROM orders WHERE order_number = ?";
    const [rows] = await db.query(query, [orderNumber]);
    return rows;
  },

  updateById: async (id, updates) => {
    const query = "UPDATE orders SET ? WHERE id = ?";
    return await db.query(query, [updates, id]);
  },

  updateByOrderNumber: async (orderNumber, updates) => {
    const query = "UPDATE orders SET ? WHERE order_number = ?";
    return await db.query(query, [updates, orderNumber]);
  },
};

module.exports = { Order, createOrderTable, createOrderItemsTable };

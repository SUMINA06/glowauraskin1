const db = require('../config/db');

const paymentTableQuery = `
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  gateway_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
)
`;

const createPaymentTable = async () => {
  try {
    await db.query(paymentTableQuery);
    console.log('Payments table created or already exists');
  } catch (err) {
    console.error('Error creating payments table:', err);
  }
};

const Payment = {
  create: async (paymentData) => {
    const query = 'INSERT INTO payments SET ?';
    return await db.query(query, [paymentData]);
  },

  findByTransactionId: async (transactionId) => {
    const query = 'SELECT * FROM payments WHERE transaction_id = ? LIMIT 1';
    const [rows] = await db.query(query, [transactionId]);
    return rows[0] || null;
  },

  findByOrderId: async (orderId) => {
    const query = 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC';
    const [rows] = await db.query(query, [orderId]);
    return rows;
  }
};

module.exports = { Payment, createPaymentTable };

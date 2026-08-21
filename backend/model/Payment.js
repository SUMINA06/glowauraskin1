const db = require("../config/db");

// =====================================================
// CREATE PAYMENTS TABLE
// =====================================================

const paymentTableQuery = `
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,

  order_id INT NOT NULL,

  transaction_id VARCHAR(255) NULL,

  payment_method VARCHAR(50) NOT NULL,

  payment_status ENUM(
    'pending',
    'completed',
    'failed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',

  amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  gateway_response TEXT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_order_id (order_id),

  FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE
)
`;


// =====================================================
// CREATE TABLE
// =====================================================

const createPaymentTable = async () => {
  try {
    await db.query(paymentTableQuery);

    console.log(
      "Payments table created or already exists"
    );
  } catch (err) {
    console.error(
      "Error creating payments table:",
      err
    );
  }
};


// =====================================================
// PAYMENT MODEL
// =====================================================

const Payment = {

  // ---------------------------------------------------
  // CREATE PAYMENT
  // ---------------------------------------------------

  create: async (paymentData) => {

    const query = `
      INSERT INTO payments
      SET ?
    `;

    const [result] = await db.query(
      query,
      [paymentData]
    );

    return result;
  },


  // ---------------------------------------------------
  // FIND BY TRANSACTION ID
  // ---------------------------------------------------

  findByTransactionId: async (
    transactionId
  ) => {

    if (!transactionId) {
      return null;
    }

    const query = `
      SELECT *
      FROM payments
      WHERE transaction_id = ?
      LIMIT 1
    `;

    const [rows] = await db.query(
      query,
      [transactionId]
    );

    return rows[0] || null;
  },


  // ---------------------------------------------------
  // FIND PAYMENTS BY ORDER ID
  // ---------------------------------------------------

  findByOrderId: async (
    orderId
  ) => {

    const query = `
      SELECT *
      FROM payments
      WHERE order_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await db.query(
      query,
      [orderId]
    );

    return rows;
  },


  // ---------------------------------------------------
  // FIND LATEST PAYMENT FOR ORDER
  // ---------------------------------------------------

  findLatestByOrderId: async (
    orderId
  ) => {

    const query = `
      SELECT *
      FROM payments
      WHERE order_id = ?
      ORDER BY id DESC
      LIMIT 1
    `;

    const [rows] = await db.query(
      query,
      [orderId]
    );

    return rows[0] || null;
  },


  // ---------------------------------------------------
  // UPDATE PAYMENT
  // ---------------------------------------------------

  update: async (
    paymentId,
    paymentData
  ) => {

    const query = `
      UPDATE payments
      SET ?
      WHERE id = ?
    `;

    const [result] = await db.query(
      query,
      [
        paymentData,
        paymentId
      ]
    );

    return result;
  },


  // ---------------------------------------------------
  // UPDATE PAYMENT BY ORDER ID
  // ---------------------------------------------------

  updateByOrderId: async (
    orderId,
    paymentData
  ) => {

    const query = `
      UPDATE payments
      SET ?
      WHERE order_id = ?
    `;

    const [result] = await db.query(
      query,
      [
        paymentData,
        orderId
      ]
    );

    return result;
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  Payment,
  createPaymentTable
};
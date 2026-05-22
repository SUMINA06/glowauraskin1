const db = require('../config/db');

// Product Table Structure
const productTableQuery = `
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

// Create Product Table
const createProductTable = async () => {
  try {
    await db.query(productTableQuery);
    console.log('Products table created or already exists');
  } catch (err) {
    console.error('Error creating products table:', err);
  }
};

// Product Model Functions
const Product = {
  // Create new product
  create: async (productData) => {
    const query = 'INSERT INTO products SET ?';
    return await db.query(query, [productData]);
  },

  // Get product by ID
  findById: async (id) => {
    const query = 'SELECT * FROM products WHERE id = ?';
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get all products
  findAll: async () => {
    const query = 'SELECT * FROM products';
    const [rows] = await db.query(query);
    return rows;
  },

  // Get products by category
  findByCategory: async (category) => {
    const query = 'SELECT * FROM products WHERE category = ?';
    const [rows] = await db.query(query, [category]);
    return rows;
  },

  // Get active products
  findActive: async () => {
    const query = 'SELECT * FROM products WHERE is_active = TRUE';
    const [rows] = await db.query(query);
    return rows;
  },

  // Update product
  update: async (id, productData) => {
    const query = 'UPDATE products SET ? WHERE id = ?';
    return await db.query(query, [productData, id]);
  },

  // Delete product
  delete: async (id) => {
    const query = 'DELETE FROM products WHERE id = ?';
    const [result] = await db.query(query, [id]);

    const [countRows] = await db.query('SELECT COUNT(*) AS count FROM products');
    const remaining = Array.isArray(countRows) ? countRows[0]?.count : 0;
    if (remaining === 0) {
      await db.query('ALTER TABLE products AUTO_INCREMENT = 1');
    }

    return result;
  },

  // Search products
  search: async (searchTerm) => {
    const query = 'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?';
    const term = `%${searchTerm}%`;
    const [rows] = await db.query(query, [term, term]);
    return rows;
  }
};

module.exports = { Product, createProductTable };

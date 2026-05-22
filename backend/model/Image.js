const db = require('../config/db');

// Image Table Structure
const imageTableQuery = `
CREATE TABLE IF NOT EXISTS images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  image_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
)`;

// Create Image Table
const createImageTable = async () => {
  try {
    await db.query(imageTableQuery);
    console.log('Images table created or already exists');
  } catch (err) {
    console.error('Error creating images table:', err);
  }
};

// Image Model Functions
const Image = {
  // Create new image
  create: async (imageData) => {
    const query = 'INSERT INTO images SET ?';
    return await db.query(query, [imageData]);
  },

  // Get image by ID
  findById: async (id) => {
    const query = 'SELECT * FROM images WHERE id = ?';
    const [rows] = await db.query(query, [id]);
    return rows;
  },

  // Get all images for a product
  findByProductId: async (productId) => {
    const query = 'SELECT * FROM images WHERE product_id = ? ORDER BY created_at DESC';
    const [rows] = await db.query(query, [productId]);
    return rows;
  },

  // Get all images
  findAll: async () => {
    const query = 'SELECT * FROM images ORDER BY product_id, created_at DESC';
    const [rows] = await db.query(query);
    return rows;
  },

  // Update image
  update: async (id, imageData) => {
    const query = 'UPDATE images SET ? WHERE id = ?';
    return await db.query(query, [imageData, id]);
  },

  // Delete image
  delete: async (id) => {
    const query = 'DELETE FROM images WHERE id = ?';
    return await db.query(query, [id]);
  },

  // Delete all images for a product
  deleteByProductId: async (productId) => {
    const query = 'DELETE FROM images WHERE product_id = ?';
    return await db.query(query, [productId]);
  }
};

module.exports = { Image, createImageTable };

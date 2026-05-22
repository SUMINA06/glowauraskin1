const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { authMiddleware, adminMiddleware } = require("../config/jwt");
const productController = require('../controller/productController');

// Create a new product
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), productController.createProduct);

// Get all products
router.get('/', productController.getAllProducts);

// Get active products (specific route before :id)
router.get('/active', productController.getActiveProducts);

// Search products (specific route before :id)
router.get('/search', productController.searchProducts);

// Get products by category (specific route before :id)
router.get('/category/:category', productController.getProductsByCategory);

// Get product by ID (generic route after specific ones)
router.get('/:id', productController.getProductById);

// Update product
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), productController.updateProduct);

// Delete product
router.delete('/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;

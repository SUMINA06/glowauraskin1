const fs = require("fs");
const { Product } = require("../model/Product");
const { Image } = require("../model/Image");

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    // Validate required fields
    if (!name || !price) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Product name and price are required",
      });
    }

    const productData = {
      name,
      description: description || null,
      price: Number(price) || 0,
      category: category || null,
      stock: Number.isFinite(Number(stock)) ? Number(stock) : 0,
    };

    const result = await Product.create(productData);
    const productId = result[0].insertId;

    if (req.file) {
      try {
        await Image.create({
          product_id: productId,
          image_path: `/uploads/products/${req.file.filename}`,
          image_name: req.file.originalname,
        });
      } catch (imageError) {
        fs.unlinkSync(req.file.path);
        await Product.delete(productId);
        throw imageError;
      }
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { id: productId, ...productData },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(id);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product[0],
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Get active products
const getActiveProducts = async (req, res) => {
  try {
    const products = await Product.findActive();

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const products = await Product.findByCategory(category);

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Search products
const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await Product.search(query);

    res.status(200).json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock } = req.body;

    if (!id) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (product.length === 0) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updates = {
      name: name || product[0].name,
      description: description || product[0].description,
      price: price !== undefined ? Number(price) : product[0].price,
      category: category || product[0].category,
      stock: Number.isFinite(Number(stock)) ? Number(stock) : product[0].stock,
    };

    await Product.update(id, updates);

    if (req.file) {
      await Image.create({
        product_id: id,
        image_path: `/uploads/products/${req.file.filename}`,
        image_name: req.file.originalname,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.delete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getActiveProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  updateProduct,
  deleteProduct,
};

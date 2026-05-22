const { Image } = require('../model/Image');
const fs = require('fs');
const path = require('path');

// Upload image for a product
const uploadImage = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      // Delete uploaded file if product_id is missing
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageData = {
      product_id,
      image_path: `/uploads/products/${req.file.filename}`,
      image_name: req.file.originalname
    };

    const result = await Image.create(imageData);

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageId: result[0].insertId,
      imagePath: imageData.image_path
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};

// Get all images for a product
const getProductImages = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const images = await Image.findByProductId(product_id);

    res.status(200).json({
      success: true,
      data: images,
      count: images.length
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching images',
      error: error.message
    });
  }
};

// Get all images
const getAllImages = async (req, res) => {
  try {
    const images = await Image.findAll();

    res.status(200).json({
      success: true,
      data: images,
      count: images.length
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching images',
      error: error.message
    });
  }
};

// Get image by ID
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required'
      });
    }

    const image = await Image.findById(id);

    if (image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image[0]
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching image',
      error: error.message
    });
  }
};

// Update image
const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required'
      });
    }

    // Check if image exists
    const image = await Image.findById(id);
    if (image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    await Image.update(id, updates);

    res.status(200).json({
      success: true,
      message: 'Image updated successfully'
    });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    });
  }
};

// Delete image
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required'
      });
    }

    // Get image details before deletion
    const image = await Image.findById(id);
    if (image.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete file from uploads folder
    const imagePath = path.join(__dirname, '../..', image[0].image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Image.delete(id);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  getProductImages,
  getAllImages,
  getImageById,
  updateImage,
  deleteImage
};

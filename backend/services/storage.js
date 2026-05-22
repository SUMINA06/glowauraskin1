const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadImage = ({ buffer, filename, folder }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );

    stream.end(buffer);
  });

const deleteImage = async (publicId) => {
  if (!publicId) {
    return null;
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = { uploadImage, deleteImage };

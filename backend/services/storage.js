const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

const hasCloudinaryConfig = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET,
);

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadImage = ({ buffer, filename, folder }) => {
  if (!hasCloudinaryConfig) {
    const safeFolder = String(folder || "uploads").replace(/[^a-zA-Z0-9_-]/g, "");
    const extension = path.extname(filename || "") || ".jpg";
    const fileName = `${crypto.randomUUID()}${extension.toLowerCase()}`;
    const relativePath = path.join(safeFolder, fileName);
    const absolutePath = path.join(__dirname, "..", "uploads", relativePath);

    return fs.promises
      .mkdir(path.dirname(absolutePath), { recursive: true })
      .then(() => fs.promises.writeFile(absolutePath, buffer))
      .then(() => ({
        url: `/uploads/${relativePath.replace(/\\/g, "/")}`,
        publicId: `local:${relativePath}`,
        bytes: buffer.length,
        format: extension.slice(1).toLowerCase(),
      }));
  }

  return new Promise((resolve, reject) => {
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
};

const deleteImage = async (publicId) => {
  if (!publicId) {
    return null;
  }
  if (publicId.startsWith("local:")) {
    const relativePath = publicId.slice("local:".length);
    const absolutePath = path.join(__dirname, "..", "uploads", relativePath);
    return fs.promises.unlink(absolutePath).catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
      return null;
    });
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = { uploadImage, deleteImage };

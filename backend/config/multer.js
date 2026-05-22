const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");
const productUploadDir = path.join(uploadsDir, "products");
const paymentUploadDir = path.join(uploadsDir, "payments");

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(productUploadDir);
ensureDirectoryExists(paymentUploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "paymentScreenshot") {
      return cb(null, paymentUploadDir);
    }

    if (file.fieldname === "image" || file.fieldname === "product_image") {
      return cb(null, productUploadDir);
    }

    return cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const allowedMimes = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }
  const allowedList = allowedMimes.map((m) => m.split('/')[1]).join(', ');
  cb(new Error(`Only image files are allowed (${allowedList})`), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;

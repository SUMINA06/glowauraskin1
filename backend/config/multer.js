const multer = require("multer");

const storage = multer.memoryStorage();

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

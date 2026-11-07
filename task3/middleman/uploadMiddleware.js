const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
};

const upload = multer({
  storage: multer.memoryStorage(), // keep files in RAM, we send them straight to Cloudinary
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB each, max 5 files
});

// Wrapper so upload errors become clean 400 responses
const handleImageUpload = (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

module.exports = { handleImageUpload };
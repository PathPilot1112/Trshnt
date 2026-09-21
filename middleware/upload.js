import multer from "multer";
import path from "path";

// Use memoryStorage so files are held as Buffer in RAM.
// This is required for Vercel / serverless environments where the
// filesystem is read-only and an `uploads/` directory cannot be created.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|jfif|heic/i;
  const extOk = allowedExts.test(path.extname(file.originalname || '').toLowerCase());
  const mimeOk = file.mimetype && (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream');
  if (extOk || mimeOk) cb(null, true);
  else cb(new Error("Only image files (jpg, png, webp) are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

export default upload;

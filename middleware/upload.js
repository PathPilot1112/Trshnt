import multer from "multer";
import path from "path";

// Use memoryStorage so files are held as Buffer in RAM.
// This is required for Vercel / serverless environments where the
// filesystem is read-only and an `uploads/` directory cannot be created.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase());
  if (ok) cb(null, true);
  else cb(new Error("Only image files (jpg, png, webp) are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

export default upload;

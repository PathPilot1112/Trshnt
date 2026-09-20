import express from "express";
import { getCurrentClue, submitPhoto, submitReport } from "../controllers/clueController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import multer from "multer";

const router = express.Router();

// Get the current clue for the team
router.get("/current", protect, getCurrentClue);

// Submit a photo for the current clue (using 'image' field)
// Wraps multer in a custom handler so any multer error returns JSON, not HTML.
router.post("/submit", protect, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ message: err.message || "File upload failed" });
    }
    next();
  });
}, submitPhoto);

// Submit issue or feedback report during test mode / active run
router.post("/report", protect, submitReport);

export default router;

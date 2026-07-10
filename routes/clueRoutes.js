import express from "express";
import { getCurrentClue, submitPhoto } from "../controllers/clueController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get the current clue for the team
router.get("/current", protect, getCurrentClue);

// Submit a photo for the current clue (using 'image' field)
router.post("/submit", protect, upload.single("image"), submitPhoto);

export default router;

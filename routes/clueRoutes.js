import express from "express";
import { getCurrentClue, submitPhoto, submitReport } from "../controllers/clueController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get the current clue for the team
router.get("/current", protect, getCurrentClue);

// Submit a photo for the current clue (using 'image' field)
router.post("/submit", protect, upload.single("image"), submitPhoto);

// Submit issue or feedback report during test mode / active run
router.post("/report", protect, submitReport);

export default router;

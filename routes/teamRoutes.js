import express from 'express';
import { updateLocation, joinGame, getPlayerProfile, startMission } from "../controllers/teamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/join", joinGame);
router.get("/me", protect, getPlayerProfile);
router.post("/start", protect, startMission);
router.put("/location", protect, updateLocation);

export default router;
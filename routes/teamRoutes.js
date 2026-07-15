import express from 'express';
import { updateLocation, joinGame, getPlayerProfile, loginWithQr, startMission } from "../controllers/teamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/join", joinGame);
router.post("/scan-login", loginWithQr);
router.get("/me", protect, getPlayerProfile);
router.post("/start", protect, startMission);
router.put("/location", protect, updateLocation);

export default router;

import express from 'express';
import { updateLocation, joinGame, getPlayerProfile, loginWithQr, startMission, logout, validateTeam, validateMember } from "../controllers/teamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/join", joinGame);
router.post("/validate-team", validateTeam);
router.post("/validate-member", validateMember);
router.post("/scan-login", loginWithQr);
router.post("/logout", protect, logout);
router.get("/me", protect, getPlayerProfile);
router.post("/start", protect, startMission);
router.put("/location", protect, updateLocation);

export default router;

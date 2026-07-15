import express from "express";
import { getLeaderboard, getTeam } from "../controllers/teamController.js";
import {
  createClue,
  updateClue,
  deleteClue,
  listClues,
  listTeams,
  listSubmissions,
  adminLogin,
  startTeamMission,
  resetTeamMission,
  clueOverride,
  getLeaderboardSnapshot,
  stopTeamTimer
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/leaderboard/live", protect, adminOnly, getLeaderboardSnapshot);
router.get("/teams", protect, adminOnly, listTeams);
router.get("/submissions", protect, adminOnly, listSubmissions);
router.get("/clues", protect, adminOnly, listClues);
router.post("/clues", protect, adminOnly, createClue);
router.put("/clues/:id", protect, adminOnly, updateClue);
router.delete("/clues/:id", protect, adminOnly, deleteClue);
router.get("/:id", protect, adminOnly, getTeam);

router.post("/teams/:id/start", protect, adminOnly, startTeamMission);
router.post("/teams/:id/stop", protect, adminOnly, stopTeamTimer);
router.post("/teams/:id/reset", protect, adminOnly, resetTeamMission);
router.post("/teams/:id/clue-override", protect, adminOnly, clueOverride);

export default router;

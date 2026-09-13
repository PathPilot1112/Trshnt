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
  stopTeamTimer,
  getClueLocations,
  clearSubmissions,
  resetTeamSession,
  getAllRoutes,
  assignTeamRoute,
  getSystemStatus,
  toggleTestDevMode,
  toggleCoordMapping,
  getReports,
  updateReportStatus,
  deleteReport,
  clearAllReports,
  updateTeam,
  deleteTeam,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/leaderboard/live", protect, adminOnly, getLeaderboardSnapshot);
router.get("/teams", protect, adminOnly, listTeams);
router.get("/submissions", protect, adminOnly, listSubmissions);
router.post("/submissions/clear", protect, adminOnly, clearSubmissions);
router.get("/clue-locations", protect, adminOnly, getClueLocations);
router.get("/routes", protect, adminOnly, getAllRoutes);
router.get("/clues", protect, adminOnly, listClues);
router.post("/clues", protect, adminOnly, createClue);
router.put("/clues/:id", protect, adminOnly, updateClue);
router.delete("/clues/:id", protect, adminOnly, deleteClue);

// System State & Test Dev Mode Routes
router.get("/system-state", getSystemStatus);
router.post("/toggle-test-mode", protect, adminOnly, toggleTestDevMode);
router.post("/toggle-coord-mapping", protect, adminOnly, toggleCoordMapping);

// Feedback Reports Routes
router.get("/reports", protect, adminOnly, getReports);
router.put("/reports/:id/status", protect, adminOnly, updateReportStatus);
router.delete("/reports/clear", protect, adminOnly, clearAllReports);
router.delete("/reports/:id", protect, adminOnly, deleteReport);

router.put("/teams/:id", protect, adminOnly, updateTeam);
router.delete("/teams/:id", protect, adminOnly, deleteTeam);

router.get("/:id", protect, adminOnly, getTeam);

router.post("/teams/:id/start", protect, adminOnly, startTeamMission);
router.post("/teams/:id/assign-route", protect, adminOnly, assignTeamRoute);
router.post("/teams/:id/stop", protect, adminOnly, stopTeamTimer);
router.post("/teams/:id/reset", protect, adminOnly, resetTeamMission);
router.post("/teams/:id/reset-session", protect, adminOnly, resetTeamSession);
router.post("/teams/:id/clue-override", protect, adminOnly, clueOverride);

export default router;

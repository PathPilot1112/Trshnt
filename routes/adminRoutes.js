import router from "express";
import { getLeaderboard, getTeam } from "../controllers/teamController.js";
import {createClue, updateClue, deleteClue, listClues, listTeams, listSubmissions} from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";

router.get("/leaderboard", protect, getLeaderboard);
router.get("/:id", protect, getTeam);
router.get("/clues", protect, listClues);
router.post("/clues", protect, createClue);
router.put("/clues/:id", protect, updateClue);
router.delete("/clues/:id", protect, deleteClue);
router.get("/teams", protect, listTeams);
router.get("/submissions", protect, listSubmissions);

export default router;

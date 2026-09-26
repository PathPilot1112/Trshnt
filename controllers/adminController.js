import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import { buildRandomCluePath, assignRouteToTeam, getRoutes } from "../utils/cluePath.js";
import { getSystemState, setSystemState } from "../utils/systemConfig.js";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const JWT_SECRET = process.env.JWT_SECRET || "chernobylsecret";

const computeElapsedMs = (team) => {
  const base = team.timerAccumulatedMs || 0;
  if (!team.timerRunning || !team.timerStartedAt) return base;
  return base + (Date.now() - new Date(team.timerStartedAt).getTime());
};

const buildLeaderboardEntry = (team) => ({
  teamId: team._id,
  name: team.name,
  score: team.score,
  status: team.status,
  currentClueIndex: team.currentClueIndex,
  elapsedMs: computeElapsedMs(team),
  timerRunning: team.timerRunning,
  timerStartedAt: team.timerStartedAt,
  timerAccumulatedMs: team.timerAccumulatedMs || 0,
  location: team.location,
});

const buildSnapshot = (teams) =>
  teams
    .map(buildLeaderboardEntry)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.currentClueIndex !== a.currentClueIndex) return b.currentClueIndex - a.currentClueIndex;
      return a.elapsedMs - b.elapsedMs;
    });

// --- Admin Authentication ---

export const adminLogin = async (req, res) => {
  const { email, password, pin, accessCode } = req.body;
  const inputCode = String(accessCode || pin || password || "").trim();
  
  const targetPassword = String(process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || "1234").trim();
  const targetEmail = process.env.ADMIN_MAIL || "admin@pripyatexodus.com";

  const isMatch = (inputCode && inputCode === targetPassword) || 
                  (email && email.toLowerCase() === targetEmail.toLowerCase() && inputCode === targetPassword);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid admin access code" });
  }

  try {
    // Find or create admin user in DB to satisfy JWT verification
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      adminUser = new User({
        name: "Command Operator",
        email: targetEmail.toLowerCase(),
        role: "admin"
      });
      await adminUser.save();
    }

    const token = jwt.sign(
      { id: adminUser._id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during admin login", error: err.message });
  }
};

// --- Clues CRUD ---

export const createClue = async(req,res)=>{
  try {
    const { clueId, order, title, text, hint, targetLabel, confidenceThreshold, points } = req.body;
    const clue = new Clue({ clueId, order, title, text, hint, targetLabel, confidenceThreshold, points });
    await clue.save();
    res.status(201).json({ clue });
  } catch (err) {
    res.status(500).json({ message: "Error creating clue", error: err.message });
  }
}

export const updateClue = async (req, res) => {
  try {
    const clue = await Clue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clue) return res.status(404).json({ message: "Clue not found" });
    res.json({ clue });
  } catch (err) {
    res.status(500).json({ message: "Error updating clue", error: err.message });
  }
};

export const deleteClue = async (req, res) => {
  try {
    await Clue.findByIdAndDelete(req.params.id);
    res.json({ message: "Clue deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting clue", error: err.message });
  }
};

export const listClues = async (req, res) => {
  try {
    const clues = await Clue.find().sort({ order: 1 });
    res.json({ clues });
  } catch (err) {
    res.status(500).json({ message: "Error listing clues", error: err.message });
  }
};

// --- Teams Management ---

export const listTeams = async(req, res)=>{
  try {
    const teams = await Team.find().populate("members", "name email");
    const activeTeamIds = teams.map((t) => t._id);
    const totalParticipants = await User.countDocuments({ role: "player", team: { $in: activeTeamIds } });
    res.json({ teams, totalParticipants });
  } catch (err) {
    res.status(500).json({ message: "Error listing teams", error: err.message });
  }
}

export const getAllRoutes = async (req, res) => {
  try {
    const routes = getRoutes();
    res.json({ routes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching routes list", error: err.message });
  }
};

export const assignTeamRoute = async (req, res) => {
  try {
    const { routeId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const clues = await Clue.find();
    assignRouteToTeam(team, routeId, clues);
    await team.save();

    res.json({ message: `Route ${team.assignedRouteName} assigned successfully`, team });
  } catch (err) {
    res.status(500).json({ message: "Error assigning route", error: err.message });
  }
};

export const startTeamMission = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const reqRouteId = req.body?.routeId || req.query?.routeId;
    const selectedRouteId = reqRouteId ? Number(reqRouteId) : null;
    const clues = await Clue.find();

    team.status = "in_progress";
    team.startedAt = new Date();
    team.timerStartedAt = new Date();
    team.timerStoppedAt = undefined;
    team.timerAccumulatedMs = 0;
    team.timerRunning = true;
    team.currentClueIndex = 0;
    team.completedClues = [];
    team.score = 0;
    
    // Automatically pick & save a random route out of 50 if no specific route requested
    assignRouteToTeam(team, selectedRouteId, clues);
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:status", {
        teamId: team._id,
        status: "in_progress",
        startedAt: team.startedAt,
        timerStartedAt: team.timerStartedAt,
        timerAccumulatedMs: team.timerAccumulatedMs,
        timerRunning: team.timerRunning,
        assignedRouteId: team.assignedRouteId,
        assignedRouteName: team.assignedRouteName,
      });
    }

    res.json({ message: "Mission started successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error starting mission", error: err.message });
  }
};

export const stopTeamTimer = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.timerRunning && team.timerStartedAt) {
      team.timerAccumulatedMs =
        (team.timerAccumulatedMs || 0) + (Date.now() - new Date(team.timerStartedAt).getTime());
    }

    team.timerRunning = false;
    team.timerStoppedAt = new Date();
    team.timerStartedAt = undefined;
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:timer", {
        teamId: team._id,
        timerRunning: false,
        timerAccumulatedMs: team.timerAccumulatedMs,
        timerStoppedAt: team.timerStoppedAt,
      });
    }

    res.json({ message: "Team timer stopped successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error stopping timer", error: err.message });
  }
};

export const resetTeamMission = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.status = "not_started";
    team.score = 0;
    team.currentClueIndex = 0;
    team.completedClues = [];
    team.cluePath = [];
    team.startedAt = undefined;
    team.finishedAt = undefined;
    team.timerStartedAt = undefined;
    team.timerStoppedAt = undefined;
    team.timerAccumulatedMs = 0;
    team.timerRunning = false;
    team.activeSessionToken = null;
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:status", { teamId: team._id, status: "not_started", activeSessionToken: null });
      io.emit("leaderboard:update", { teamId: team._id, name: team.name, score: 0, currentClueIndex: 0 });
    }

    res.json({ message: "Mission reset successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error resetting mission", error: err.message });
  }
};

export const resetTeamSession = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.activeSessionToken = null;
    team.lastIp = null;
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:status", { teamId: team._id, status: team.status, activeSessionToken: null, lastIp: null });
    }

    res.json({ message: "Team session lock & active IP reset successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error resetting session", error: err.message });
  }
};

export const clueOverride = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const clues = await Clue.find();
    if (!team.cluePath?.length) {
      team.cluePath = buildRandomCluePath(clues);
    }
    team.currentClueIndex += 1;
    team.score += 100;

    if (team.currentClueIndex >= team.cluePath.length) {
      team.status = "finished";
      team.finishedAt = new Date();
    }

    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("leaderboard:update", {
        teamId: team._id,
        name: team.name,
        score: team.score,
        currentClueIndex: team.currentClueIndex,
        elapsedMs: computeElapsedMs(team),
      });
    }

    res.json({ message: "Clue overridden successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error overriding clue", error: err.message });
  }
};

// --- Submissions (audit log / manual override) ---

export const listSubmissions = async (req, res) => {
  try {
    const { teamId, clueId } = req.query;
    const filter = {};
    if (teamId) filter.team = teamId;
    if (clueId) filter.clue = clueId;

    const submissions = await Submission.find(filter)
      .populate("team", "name")
      .populate("clue", "title order")
      .sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: "Error listing submissions", error: err.message });
  }
};

export const getLeaderboardSnapshot = async (req, res) => {
  try {
    const teams = await Team.find()
      .select("name score currentClueIndex status location timerStartedAt timerAccumulatedMs timerRunning")
      .lean();

    res.json({ teams: buildSnapshot(teams) });
  } catch (err) {
    res.status(500).json({ message: "Error listing leaderboard snapshot", error: err.message });
  }
};

export const getClueLocations = async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "clue.json");
    const fileData = await fs.readFile(filePath, "utf8");
    const clueLocations = JSON.parse(fileData);
    res.json({ clueLocations });
  } catch (err) {
    console.error("❌ Error reading clue.json:", err.message);
    res.status(500).json({ message: "Failed to read clue locations", error: err.message });
  }
};

export const clearSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().lean();
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    const supabaseBucket = process.env.SUPABASE_BUCKET || 'images';
    
    if (supabaseUrl && supabaseKey && submissions.length > 0) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const fileNames = submissions
        .map((s) => {
          if (!s.photoUrl) return null;
          const parts = s.photoUrl.split(`/storage/v1/object/public/${supabaseBucket}/`);
          if (parts.length > 1) return parts[1];
          const segments = s.photoUrl.split('/');
          return segments[segments.length - 1];
        })
        .filter(Boolean);

      if (fileNames.length > 0) {
        console.log("🌲 Deleting files from Supabase Storage:", fileNames);
        const { data, error } = await supabase.storage.from(supabaseBucket).remove(fileNames);
        if (error) {
          console.error("❌ Failed to delete files from Supabase:", error.message);
        } else {
          console.log("✅ Successfully deleted files from Supabase:", data);
        }
      }
    }

    // 2. Delete from MongoDB
    await Submission.deleteMany({});

    // Emit event to update submissions list on dashboards without wiping team progress
    const io = req.app.get("io");
    if (io) {
      io.emit("submissions:cleared");
    }

    res.json({ message: "All submissions and storage images cleared successfully. Team progress has been preserved." });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear submissions", error: err.message });
  }
};

// --- System State & Test Mode Toggles ---

export const getSystemStatus = async (req, res) => {
  try {
    res.json(getSystemState());
  } catch (err) {
    res.status(500).json({ message: "Error reading system state", error: err.message });
  }
};

export const toggleTestDevMode = async (req, res) => {
  try {
    const currentState = getSystemState();
    const targetState = typeof req.body.enabled === "boolean" ? req.body.enabled : !currentState.testDevMode;
    const newState = setSystemState({ testDevMode: targetState });

    const io = req.app.get("io");
    if (io) {
      io.emit("system:state", newState);
    }

    res.json({ message: `Test Dev Mode is now ${newState.testDevMode ? "ENABLED" : "DISABLED"}`, state: newState });
  } catch (err) {
    res.status(500).json({ message: "Error toggling Test Dev Mode", error: err.message });
  }
};

export const toggleCoordMapping = async (req, res) => {
  try {
    const currentState = getSystemState();
    const targetState = typeof req.body.enabled === "boolean" ? req.body.enabled : !currentState.coordMappingEnabled;
    const newState = setSystemState({ coordMappingEnabled: targetState });

    const io = req.app.get("io");
    if (io) {
      io.emit("system:state", newState);
    }

    res.json({ message: `Coordinate Mapping (3-4m circular range) is now ${newState.coordMappingEnabled ? "ENABLED" : "DISABLED"}`, state: newState });
  } catch (err) {
    res.status(500).json({ message: "Error toggling Coordinate Mapping", error: err.message });
  }
};

// --- Feedback Reports Management ---

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedback reports", error: err.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({ message: "Report status updated", report });
  } catch (err) {
    res.status(500).json({ message: "Error updating report status", error: err.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const io = req.app.get("io");
    if (io) {
      io.emit("report:deleted", { reportId: req.params.id });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting report", error: err.message });
  }
};

export const clearAllReports = async (req, res) => {
  try {
    await Report.deleteMany({});

    const io = req.app.get("io");
    if (io) {
      io.emit("reports:cleared");
    }

    res.json({ message: "All reports cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing reports", error: err.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { name, teamNumber, status, score, currentClueIndex, assignedRouteId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (name !== undefined && name.trim()) team.name = name.trim();
    if (teamNumber !== undefined) team.teamNumber = teamNumber;
    if (status !== undefined) {
      team.status = status;
      if (status === "finished" && !team.finishedAt) {
        team.finishedAt = new Date();
        if (team.timerRunning && team.timerStartedAt) {
          team.timerAccumulatedMs = (team.timerAccumulatedMs || 0) + (Date.now() - new Date(team.timerStartedAt).getTime());
          team.timerRunning = false;
          team.timerStoppedAt = new Date();
          team.timerStartedAt = undefined;
        }
      }
    }
    if (score !== undefined) team.score = Number(score);
    if (currentClueIndex !== undefined) team.currentClueIndex = Number(currentClueIndex);
    if (paymentVerified !== undefined) team.paymentVerified = Boolean(paymentVerified);
    if (paymentScreenshotUrl !== undefined) team.paymentScreenshotUrl = paymentScreenshotUrl;

    if (assignedRouteId !== undefined && assignedRouteId !== team.assignedRouteId) {
      const clues = await Clue.find();
      assignRouteToTeam(team, assignedRouteId, clues);
    }

    await team.save();

    const io = req.app.get("io");
    if (io) {
      const allTeams = await Team.find().populate("members", "name email");
      io.emit("teams:snapshot", allTeams.map(buildLeaderboardEntry));
      io.emit("leaderboard:snapshot", buildSnapshot(allTeams));
      io.emit("team:status", {
        teamId: team._id,
        status: team.status,
        score: team.score,
        currentClueIndex: team.currentClueIndex,
        assignedRouteId: team.assignedRouteId,
        assignedRouteName: team.assignedRouteName,
        paymentVerified: team.paymentVerified,
      });
    }

    res.json({ message: "Team updated successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error updating team", error: err.message });
  }
};

export const verifyTeamPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentVerified } = req.body;
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.paymentVerified = paymentVerified !== undefined ? Boolean(paymentVerified) : !team.paymentVerified;
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:payment", { teamId: team._id, paymentVerified: team.paymentVerified });
    }

    res.json({ message: `Payment verified status updated to ${team.paymentVerified}`, team });
  } catch (err) {
    res.status(500).json({ message: "Error updating payment status", error: err.message });
  }
};

export const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { isCorrect } = req.body;
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const wasCorrect = submission.isCorrect;
    const newIsCorrect = isCorrect !== undefined ? Boolean(isCorrect) : submission.isCorrect;

    submission.isCorrect = newIsCorrect;
    await submission.save();

    // If marked as ACCEPTED (true), automatically accept the clue for the team and advance them forward
    if (!wasCorrect && newIsCorrect && submission.team) {
      const team = await Team.findById(submission.team);
      if (team && team.status !== "finished") {
        const clueId = submission.clue;
        const alreadyCompleted = team.completedClues?.some(
          (c) => String(c.clue?._id || c.clue) === String(clueId)
        );

        if (!alreadyCompleted) {
          team.completedClues.push({
            clue: clueId,
            photoUrl: submission.photoUrl,
            completedAt: new Date(),
          });
        }

        const clues = await Clue.find();
        if (!team.cluePath?.length) {
          team.cluePath = buildRandomCluePath(clues);
        }

        team.score = (team.score || 0) + 100;
        team.currentClueIndex = (team.currentClueIndex || 0) + 1;

        if (team.currentClueIndex >= team.cluePath.length) {
          team.status = "finished";
          team.finishedAt = new Date();
          if (team.timerRunning && team.timerStartedAt) {
            team.timerAccumulatedMs =
              (team.timerAccumulatedMs || 0) + (Date.now() - new Date(team.timerStartedAt).getTime());
          }
          team.timerRunning = false;
          team.timerStoppedAt = new Date();
          team.timerStartedAt = undefined;
        } else if (team.status === "not_started") {
          team.status = "in_progress";
        }

        await team.save();

        const io = req.app.get("io");
        if (io) {
          const allTeams = await Team.find().populate("members", "name email");
          io.emit("teams:snapshot", allTeams.map(buildLeaderboardEntry));
          io.emit("leaderboard:snapshot", buildSnapshot(allTeams));
          io.emit("team:status", {
            teamId: team._id,
            status: team.status,
            score: team.score,
            currentClueIndex: team.currentClueIndex,
            assignedRouteId: team.assignedRouteId,
            assignedRouteName: team.assignedRouteName,
          });
          io.emit("leaderboard:update", {
            teamId: team._id,
            name: team.name,
            score: team.score,
            currentClueIndex: team.currentClueIndex,
            elapsedMs: computeElapsedMs(team),
          });
        }
      }
    }

    res.json({ message: "Submission updated successfully", submission });
  } catch (err) {
    console.error("Error updating submission:", err);
    res.status(500).json({ message: "Error updating submission", error: err.message });
  }
};


export const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findByIdAndDelete(id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    res.json({ message: "Submission deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting submission", error: err.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    await Submission.deleteMany({ team: teamId });
    await Report.deleteMany({ team: teamId });
    await User.updateMany({ team: teamId }, { $unset: { team: 1 } });
    await Team.findByIdAndDelete(teamId);

    const io = req.app.get("io");
    if (io) {
      const remainingTeams = await Team.find().populate("members", "name email");
      io.emit("teams:snapshot", remainingTeams.map(buildLeaderboardEntry));
      io.emit("leaderboard:snapshot", buildSnapshot(remainingTeams));
      io.emit("team:deleted", { teamId });
    }

    res.json({ message: `Team ${team.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: "Error deleting team", error: err.message });
  }
};



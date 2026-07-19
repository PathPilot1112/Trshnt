import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const JWT_SECRET = process.env.JWT_SECRET || "stalkersecret";

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
  const { email, password } = req.body;
  
  const targetEmail = process.env.ADMIN_MAIL || "admintest@gmail.com";
  const targetPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (email !== targetEmail || password !== targetPassword) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  try {
    // Find or create admin user in DB to satisfy JWT verification
    let adminUser = await User.findOne({ email: targetEmail.toLowerCase() });
    if (!adminUser) {
      adminUser = new User({
        name: "Admin Operator",
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
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: "Error listing teams", error: err.message });
  }
}

export const startTeamMission = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    team.status = "in_progress";
    team.startedAt = new Date();
    team.timerStartedAt = new Date();
    team.timerStoppedAt = undefined;
    team.timerAccumulatedMs = 0;
    team.timerRunning = true;
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
    team.startedAt = undefined;
    team.finishedAt = undefined;
    team.timerStartedAt = undefined;
    team.timerStoppedAt = undefined;
    team.timerAccumulatedMs = 0;
    team.timerRunning = false;
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:status", { teamId: team._id, status: "not_started" });
      io.emit("leaderboard:update", { teamId: team._id, name: team.name, score: 0, currentClueIndex: 0 });
    }

    res.json({ message: "Mission reset successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error resetting mission", error: err.message });
  }
};

export const clueOverride = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const clues = await Clue.find().sort({ order: 1 });
    team.currentClueIndex += 1;
    team.score += 100; // Award points for manual skip

    if (team.currentClueIndex >= clues.length) {
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
    
    // 3. Clear completedClues and score for all teams
    await Team.updateMany({}, { completedClues: [], score: 0, currentClueIndex: 0, status: "not_started" });

    // Emit event to update leaderboard and reset dashboards
    const io = req.app.get("io");
    if (io) {
      io.emit("submissions:cleared");
      io.emit("leaderboard:snapshot", []);
    }

    res.json({ message: "All submissions and S3 images cleared successfully, teams reset." });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear submissions", error: err.message });
  }
};

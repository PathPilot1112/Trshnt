import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// --- Admin Authentication ---

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  const targetEmail = process.env.ADMIN_MAIL || "admin@stalker.net";
  const targetPassword = process.env.ADMIN_PASSWORD || "liquidator";

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
      process.env.JWT_SECRET || "stalkersecret",
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
    await team.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("team:status", { teamId: team._id, status: "in_progress", startedAt: team.startedAt });
    }

    res.json({ message: "Mission started successfully", team });
  } catch (err) {
    res.status(500).json({ message: "Error starting mission", error: err.message });
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
        currentClueIndex: team.currentClueIndex
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

import Team from "../models/Team.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "stalkersecret";

const buildToken = (userId, role) =>
  jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });

const buildTeamPayload = (team) => ({
  id: team._id,
  name: team.name,
  status: team.status,
  score: team.score,
  currentClueIndex: team.currentClueIndex,
  startedAt: team.startedAt,
  finishedAt: team.finishedAt,
  timerStartedAt: team.timerStartedAt,
  timerStoppedAt: team.timerStoppedAt,
  timerAccumulatedMs: team.timerAccumulatedMs,
  timerRunning: team.timerRunning,
  location: team.location,
});

const parseQrPayload = (qrData) => {
  if (!qrData || typeof qrData !== "string") return null;

  try {
    const parsed = JSON.parse(qrData);
    if (parsed?.teamId) return parsed.teamId;
  } catch {
    // continue with plain-text parsing
  }

  const prefixed = qrData.match(/team:([a-f0-9]{24})/i);
  if (prefixed) return prefixed[1];

  if (/^[a-f0-9]{24}$/i.test(qrData.trim())) {
    return qrData.trim();
  }

  return null;
};

// --- Player Join / Registration ---

export const joinGame = async (req, res) => {
  const { operatorName, teamName } = req.body;
  if (!operatorName) {
    return res.status(400).json({ message: "Operator name is required" });
  }

  try {
    // 1. Find or create user
    const email = `${operatorName.toLowerCase()}@stalker.net`;
    let user = await User.findOne({ email });
    let team;

    if (user) {
      if (user.team) {
        team = await Team.findById(user.team);
      }
    } else {
      user = new User({
        name: operatorName,
        email,
        role: "player"
      });
      await user.save();
    }

    // 2. If user doesn't have a team, find or create one
    if (!team) {
      const finalTeamName = teamName || `TEAM_${operatorName.toUpperCase()}`;
      team = await Team.findOne({ name: finalTeamName });
      
      if (!team) {
        team = new Team({
          name: finalTeamName,
          status: "not_started"
        });
      }

      // Add user to team members if not already there
      if (!team.members.includes(user._id)) {
        team.members.push(user._id);
      }
      await team.save();

      // Update user team reference
      user.team = team._id;
      await user.save();
    }

    // 3. Generate JWT
    const token = buildToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      team: buildTeamPayload(team)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during join game", error: err.message });
  }
};

export const loginWithQr = async (req, res) => {
  const { qrData } = req.body;
  const teamId = parseQrPayload(qrData);

  if (!teamId) {
    return res.status(400).json({ message: "Invalid QR payload" });
  }

  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "QR is not mapped to any team" });
    }

    const email = `qr_${team._id}@stalker.net`;
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: `${team.name}_QR`,
        email,
        role: "player",
        team: team._id,
      });
      await user.save();
    } else if (!user.team || String(user.team) !== String(team._id)) {
      user.team = team._id;
      await user.save();
    }

    if (!team.members.some((memberId) => String(memberId) === String(user._id))) {
      team.members.push(user._id);
      await team.save();
    }

    const token = buildToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      team: buildTeamPayload(team),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during QR login", error: err.message });
  }
};

// --- Player Profile & Status ---

export const getPlayerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const team = await Team.findById(user.team).populate("members", "name email");
    res.json({ user, team: buildTeamPayload(team) });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// --- Start Mission ---
export const startMission = async (req, res) => {
  try {
    const team = await Team.findById(req.user.team);
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

// --- Team Operations ---

export const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "lat and lng must be numbers" });
  }

  try {
    const team = await Team.findByIdAndUpdate(
      req.user.team,
      { location: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    if (!team) return res.status(400).json({ message: "You are not part of a team yet" });

    const io = req.app.get("io");
    if (io) {
      io.emit("team:location", {
        teamId: team._id,
        teamName: team.name,
        lat,
        lng,
        updatedAt: team.location?.updatedAt,
      });
    }

    res.json({ message: "Location updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating location", error: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const teams = await Team.find()
      .select("name score currentClueIndex status location")
      .sort({ score: -1, currentClueIndex: -1 });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: "Error getting leaderboard", error: err.message });
  }
};

export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("members", "name email");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json({ team });
  } catch (err) {
    res.status(500).json({ message: "Error getting team details", error: err.message });
  }
};

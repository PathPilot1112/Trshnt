import Team from "../models/Team.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "stalkersecret";

const buildToken = (userId, role, sessionToken = null) =>
  jwt.sign({ id: userId, role, sessionToken }, JWT_SECRET, { expiresIn: "7d" });

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-]{10,15}$/;

export const validateTeam = async (req, res) => {
  try {
    const { teamName } = req.body;
    if (!teamName) {
      return res.status(400).json({ msg: 'Team name is required.' });
    }
    const existingTeam = await Team.findOne({ name: new RegExp(`^${teamName}$`, 'i') });
    if (existingTeam) {
      return res.status(400).json({ msg: 'Team name is already taken. Please choose another.' });
    }
    res.status(200).json({ msg: 'Team name is available.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const validateMember = async (req, res) => {
  try {
    const { email, contactNumber, registerNumber } = req.body;
    
    if (!email || !contactNumber || !registerNumber) {
      return res.status(400).json({ msg: 'Missing fields for validation.' });
    }

    const existingMember = await User.findOne({
      $or: [
        { email: new RegExp(`^${email}$`, 'i') },
        { contactNumber: contactNumber },
        { registerNumber: new RegExp(`^${registerNumber}$`, 'i') }
      ]
    });

    if (existingMember) {
      if (existingMember.email.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ msg: 'Email is already registered.' });
      }
      if (existingMember.contactNumber === contactNumber) {
        return res.status(400).json({ msg: 'Contact number is already registered.' });
      }
      if (existingMember.registerNumber && existingMember.registerNumber.toLowerCase() === registerNumber.toLowerCase()) {
        return res.status(400).json({ msg: 'Register number is already registered.' });
      }
      return res.status(400).json({ msg: 'Member details conflict with an existing registration.' });
    }

    res.status(200).json({ msg: 'Member details are valid.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const joinGame = async (req, res) => {
  const { teamName, teamNumber, members, operatorName } = req.body;

  // Fallback to original single player logic if members array is not provided
  if (!members || !Array.isArray(members)) {
    if (!operatorName) {
      return res.status(400).json({ message: "Operator name or team members are required" });
    }

    try {
      const email = `${operatorName.toLowerCase()}@stalker.net`;
      let user = await User.findOne({ email });
      let team;

      if (user) {
        if (user.team) {
          team = await Team.findById(user.team);
        }
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        user = new User({
          name: operatorName,
          email,
          registerNumber: `REG-${randomNum}`,
          yearOfGraduation: '2026',
          course: 'B.Tech',
          specialization: 'General',
          contactNumber: `+9199999${randomNum}`,
          role: "player"
        });
        await user.save();
      }

      if (!team) {
        const finalTeamName = teamName || `TEAM_${operatorName.toUpperCase()}`;
        team = await Team.findOne({ name: finalTeamName });
        
        if (!team) {
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          team = new Team({
            name: finalTeamName,
            teamNumber: teamNumber || `TH-${randomNum}`,
            status: "not_started"
          });
        }

        if (!team.members.includes(user._id)) {
          team.members.push(user._id);
        }
        await team.save();

        user.team = team._id;
        await user.save();
      }

      const token = buildToken(user._id, user.role);

      return res.json({
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
      return res.status(500).json({ message: "Server error during join game", error: err.message });
    }
  }

  // Multi-member registration logic
  try {
    if (!teamName || !teamNumber) {
      return res.status(400).json({ msg: 'Please provide team name and team number.' });
    }

    if (members.length < 3 || members.length > 5) {
      return res.status(400).json({ msg: 'Team must have between 3 and 5 members.' });
    }

    // Check if team name already exists
    const existingTeamName = await Team.findOne({ name: new RegExp(`^${teamName}$`, 'i') });
    if (existingTeamName) {
      return res.status(400).json({ msg: 'Team name is already taken.' });
    }

    // Check if team number already exists
    let existingTeam = await Team.findOne({ teamNumber });
    if (existingTeam) {
      return res.status(400).json({ msg: 'Team number already exists. Please generate a new one.' });
    }

    // Validate member fields, email, phone number, and check for duplicates within the request
    const registerNumbers = new Set();
    const emails = new Set();
    const phones = new Set();
    
    const reqRegNumbers = [];
    const reqEmails = [];
    const reqPhones = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      
      if (!member.registerNumber || !member.name || !member.email || !member.contactNumber || !member.yearOfGraduation || !member.course || !member.specialization) {
         return res.status(400).json({ msg: `Operative 0${i + 1} is missing required fields.` });
      }

      if (!emailRegex.test(member.email)) {
        return res.status(400).json({ msg: `Invalid email address for Operative 0${i + 1}: ${member.email}` });
      }

      if (!phoneRegex.test(member.contactNumber)) {
        return res.status(400).json({ msg: `Invalid contact number for Operative 0${i + 1}: ${member.contactNumber}` });
      }

      if (registerNumbers.has(member.registerNumber.toLowerCase())) {
        return res.status(400).json({ msg: `Duplicate register number within the team: ${member.registerNumber}` });
      }
      registerNumbers.add(member.registerNumber.toLowerCase());
      reqRegNumbers.push(member.registerNumber);

      if (emails.has(member.email.toLowerCase())) {
        return res.status(400).json({ msg: `Duplicate email within the team: ${member.email}` });
      }
      emails.add(member.email.toLowerCase());
      reqEmails.push(member.email);

      if (phones.has(member.contactNumber)) {
        return res.status(400).json({ msg: `Duplicate contact number within the team: ${member.contactNumber}` });
      }
      phones.add(member.contactNumber);
      reqPhones.push(member.contactNumber);
    }

    // Check if any register number, email, or phone already exists in the database
    const regexRegNumbers = reqRegNumbers.map(num => new RegExp(`^${num}$`, 'i'));
    const regexEmails = reqEmails.map(e => new RegExp(`^${e}$`, 'i'));

    const existingUser = await User.findOne({
      $or: [
        { registerNumber: { $in: regexRegNumbers } },
        { email: { $in: regexEmails } },
        { contactNumber: { $in: reqPhones } }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ msg: `One or more members' register number, email, or contact number is already registered in another team.` });
    }

    // Create the team first
    const newTeam = new Team({
      name: teamName,
      teamNumber,
      status: "not_started"
    });

    await newTeam.save();

    // Create the users
    const userIds = [];
    let primaryUser = null;
    for (const member of members) {
      const newUser = new User({
        name: member.name,
        email: member.email,
        registerNumber: member.registerNumber,
        yearOfGraduation: member.yearOfGraduation,
        course: member.course,
        specialization: member.specialization,
        contactNumber: member.contactNumber,
        role: "player",
        team: newTeam._id
      });
      await newUser.save();
      userIds.push(newUser._id);
      if (!primaryUser) primaryUser = newUser;
    }

    // Update the team with user IDs
    newTeam.members = userIds;
    await newTeam.save();

    // Log the primary member in
    const token = buildToken(primaryUser._id, primaryUser.role);

    res.status(201).json({ 
      msg: 'Registration successful', 
      token,
      user: {
        id: primaryUser._id,
        name: primaryUser.name,
        email: primaryUser.email,
        role: primaryUser.role
      },
      team: {
        id: newTeam._id,
        teamName: newTeam.name,
        teamNumber: newTeam.teamNumber,
        members: members,
        ...buildTeamPayload(newTeam)
      } 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error during registration' });
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

    if (team.activeSessionToken) {
      return res.status(403).json({ message: "Team already has an active session." });
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
    }

    const sessionToken = crypto.randomUUID();
    team.activeSessionToken = sessionToken;
    await team.save();

    const token = buildToken(user._id, user.role, sessionToken);

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

export const logout = async (req, res) => {
  try {
    if (req.user?.team) {
      await Team.findByIdAndUpdate(req.user.team, { activeSessionToken: null });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
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

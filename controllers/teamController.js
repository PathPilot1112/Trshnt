import Team from "../models/Team.js";


export const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ message: "lat and lng must be numbers" });
  }

  const team = await Team.findByIdAndUpdate(
    req.user.team,
    { location: { lat, lng, updatedAt: new Date() } },
    { new: true }
  );
  if (!team) return res.status(400).json({ message: "You are not part of a team yet" });

  const io = req.app.get("io");
  io.emit("team:location", { teamId: team._id, teamName: team.name, lat, lng });

  res.json({ message: "Location updated" });
};


export const getLeaderboard = async (req, res) => {
  const teams = await Team.find()
    .select("name score currentClueIndex status location")
    .sort({ score: -1, currentClueIndex: -1 });
  res.json({ teams });
};


export const getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id).populate("members", "name email");
  if (!team) return res.status(404).json({ message: "Team not found" });
  res.json({ team });
};

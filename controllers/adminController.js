import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";

// --- Clues ---

export const createClue = async(req,res)=>{
  const { clueId, order, title, text, hint, targetLabel, confidenceThreshold, points } = req.body;
  const clue = new Clue({ clueId, order, title, text, hint, targetLabel, confidenceThreshold, points });
  await clue.save();
  res.status(201).json({ clue });
}

export const updateClue = async (req, res) => {
  const {clueId , clue, order , title, points, confidenceThreshold } = await Clue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!clue) return res.status(404).json({ message: "Clue not found" });
  res.json({ clue });
};

export const deleteClue = async (req, res) => {
  await Clue.findByIdAndDelete(req.params.id);
  res.json({ message: "Clue deleted" });
};

export const listClues = async (req, res) => {
  const clues = await Clue.find().sort({ order: 1 });
  res.json({ clues });
};

// --- Teams ---

export const listTeams = async(req, res)=>{
  const teams = await Team.find();
  res.json({ teams });
}



// --- Submissions (audit log / manual override) ---

exports.listSubmissions = async (req, res) => {
  const { teamId, clueId } = req.query;
  const filter = {};
  if (teamId) filter.team = teamId;
  if (clueId) filter.clue = clueId;

  const submissions = await Submission.find(filter)
    .populate("team", "name")
    .populate("clue", "title order")
    .sort({ createdAt: -1 });
  res.json({ submissions });
};

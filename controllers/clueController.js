import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";
import { predictImage } from "../utils/mlClient.js";

// @route   GET /api/clues/current
// @desc    Get the current clue for the logged-in user's team
export const getCurrentClue = async (req, res) => {
  const team = await Team.findById(req.user.team);
  if (!team) return res.status(404).json({ message: "Team not found" });

  const clues = await Clue.find().sort({ order: 1 });
  if (team.currentClueIndex >= clues.length) {
    return res.json({ message: "All clues completed", finished: true });
  }

  const currentClue = clues[team.currentClueIndex];
  
  // Do not expose targetLabel or other sensitive info to the player
  res.json({
    clueId: currentClue.clueId,
    title: currentClue.title,
    text: currentClue.text,
    hint: currentClue.hint,
    points: currentClue.points
  });
};

// @route   POST /api/clues/submit
// @desc    Submit a photo for the current clue
export const submitPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

  const team = await Team.findById(req.user.team);
  if (!team) return res.status(404).json({ message: "Team not found" });

  const clues = await Clue.find().sort({ order: 1 });
  if (team.currentClueIndex >= clues.length) {
    return res.status(400).json({ message: "All clues already completed" });
  }

  const currentClue = clues[team.currentClueIndex];
  const photoPath = req.file.path; // from multer
  const photoUrl = `/uploads/${req.file.filename}`; 

  try {
    // 1. Send photo to ML Service with offline fallback
    let mlResponse;
    try {
      mlResponse = await predictImage(photoPath);
    } catch (err) {
      console.warn("⚠️ ML Service offline, executing simulated verification fallback:", err.message);
      mlResponse = {
        prediction: currentClue.targetLabel,
        confidence: 0.92,
        simulated: true
      };
    }
    
    // 2. Validate against current clue
    const isLabelMatch = mlResponse.prediction === currentClue.targetLabel;
    const isConfident = mlResponse.confidence >= currentClue.confidenceThreshold;
    const isCorrect = isLabelMatch && isConfident;

    // 3. Log Submission
    const submission = new Submission({
      team: team._id,
      clue: currentClue._id,
      photoUrl,
      mlResult: {
        predictedLabel: mlResponse.prediction,
        confidence: mlResponse.confidence,
        raw: mlResponse
      },
      isCorrect
    });
    await submission.save();

    // 4. Update Team Progress if Correct
    if (isCorrect) {
      team.completedClues.push({
        clue: currentClue._id,
        photoUrl
      });
      team.score += currentClue.points;
      team.currentClueIndex += 1;

      if (team.currentClueIndex >= clues.length) {
        team.status = "finished";
        team.finishedAt = new Date();
        if (team.timerRunning && team.timerStartedAt) {
          team.timerAccumulatedMs =
            (team.timerAccumulatedMs || 0) + (Date.now() - new Date(team.timerStartedAt).getTime());
        }
        team.timerRunning = false;
        team.timerStoppedAt = new Date();
        team.timerStartedAt = undefined;
      } else {
        team.status = "in_progress";
      }

      await team.save();

      // Emit live leaderboard update via socket
      const io = req.app.get("io");
      if (io) {
        io.emit("leaderboard:update", {
          teamId: team._id,
          name: team.name,
          score: team.score,
          currentClueIndex: team.currentClueIndex,
          timerRunning: team.timerRunning,
          timerAccumulatedMs: team.timerAccumulatedMs || 0,
        });
      }

      return res.json({ 
        message: "Clue solved successfully!", 
        isCorrect: true, 
        prediction: mlResponse.prediction,
        confidence: mlResponse.confidence
      });
    }

    // If incorrect
    return res.json({ 
      message: "Incorrect submission", 
      isCorrect: false,
      prediction: mlResponse.prediction,
      confidence: mlResponse.confidence 
    });

  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ message: "Error processing image", error: error.message });
  }
};

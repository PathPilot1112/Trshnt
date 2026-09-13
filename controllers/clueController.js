import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import Submission from "../models/Submission.js";
import Report from "../models/Report.js";
import { predictImage } from "../utils/mlClient.js";
import { uploadToCloudinary, isCloudinaryConfigured } from "../utils/cloudinary.js";
import { uploadToSupabase, isSupabaseConfigured } from "../utils/supabase.js";
import { ensureCluePath, publicCluePayload } from "../utils/cluePath.js";
import { getSystemState } from "../utils/systemConfig.js";
import { isWithinGeofenceRange } from "../utils/clueLocations.js";
import fs from "fs/promises";

const getTeamClue = async (team) => {
  const clues = await Clue.find();
  await ensureCluePath(team, clues);
  const step = team.cluePath[team.currentClueIndex];
  if (!step) return { clues, currentClue: null, finished: true };
  const currentClue = clues.find((c) => String(c._id) === String(step.clue));
  return { clues, currentClue, finished: !currentClue };
};

// @route   GET /api/clues/current
// @desc    Get the current clue for the logged-in user's team
export const getCurrentClue = async (req, res) => {
  const team = await Team.findById(req.user.team);
  if (!team) return res.status(404).json({ message: "Team not found" });

  const clues = await Clue.find();
  await ensureCluePath(team, clues);
  return res.json(publicCluePayload(team, clues));
};

// @route   POST /api/clues/submit
// @desc    Submit a photo for the current clue
export const submitPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

  const team = await Team.findById(req.user.team);
  if (!team) return res.status(404).json({ message: "Team not found" });

  const { clues, currentClue, finished } = await getTeamClue(team);
  if (finished || !currentClue) {
    return res.status(400).json({ message: "All clues already completed" });
  }
  const photoPath = req.file.path; // from multer
  let photoUrl = `/uploads/${req.file.filename}`; 

  try {
    // 1. Upload to Supabase if configured (primary cloud storage)
    if (isSupabaseConfigured) {
      try {
        console.log("🌲 Uploading photo to Supabase Storage...");
        photoUrl = await uploadToSupabase(photoPath);
        console.log("🌲 Supabase Storage upload successful:", photoUrl);
      } catch (err) {
        console.error("❌ Supabase upload failed, trying Cloudinary fallback...", err.message);
        if (isCloudinaryConfigured) {
          try {
            console.log("☁️ Uploading photo to Cloudinary (fallback)...");
            photoUrl = await uploadToCloudinary(photoPath);
            console.log("☁️ Cloudinary upload successful:", photoUrl);
          } catch (cloudErr) {
            console.error("❌ Cloudinary upload failed, falling back to local storage:", cloudErr.message);
          }
        }
      }
    } else if (isCloudinaryConfigured) {
      try {
        console.log("☁️ Uploading photo to Cloudinary...");
        photoUrl = await uploadToCloudinary(photoPath);
        console.log("☁️ Cloudinary upload successful:", photoUrl);
      } catch (err) {
        console.error("❌ Cloudinary upload failed, falling back to local storage:", err.message);
      }
    }

    // 2. Send photo to ML Service with offline fallback
    let mlResponse;
    try {
      mlResponse = await predictImage(photoPath);
    } catch (err) {
      console.warn("⚠️ ML Service offline, rejecting submission:", err.message);
      
      if (isSupabaseConfigured || isCloudinaryConfigured) {
        try {
          await fs.unlink(photoPath);
        } catch (unlinkErr) {}
      }
      
      return res.status(503).json({ 
        message: "Scanning system is currently offline. Please try again later."
      });
    }
    
    // 3. Determine predicted label string and validate against current clue
    const predictedLabel = mlResponse.prediction || mlResponse.location || (mlResponse.zone && mlResponse.location ? `${mlResponse.zone} - ${mlResponse.location}` : "") || "unknown";
    const confidence = typeof mlResponse.confidence === "number" ? mlResponse.confidence : 0.9;

    // Helper to normalize strings for robust location matching
    const cleanStr = (s) => (s || "").toLowerCase().replace(/^zone\s*\d+\s*[-_:]?\s*/, "").replace(/[^a-z0-9]/g, "");
    
    const targetClean = cleanStr(currentClue.targetLabel) || cleanStr(currentClue.title);
    const predictedClean = cleanStr(predictedLabel);

    const isLabelMatch = predictedClean.length > 0 && targetClean.length > 0 &&
      (predictedClean === targetClean || predictedClean.includes(targetClean) || targetClean.includes(predictedClean));

    const isConfident = confidence >= (currentClue.confidenceThreshold || 0.50);
    let isCorrect = Boolean(isLabelMatch && isConfident);

    // Check GPS Coordinate Geofencing (3-4 meter circular range parameter)
    const { coordMappingEnabled, coordRadiusMeters } = getSystemState();
    const userLat = parseFloat(req.body?.lat || req.body?.userLat || req.query?.lat);
    const userLng = parseFloat(req.body?.lng || req.body?.userLng || req.query?.lng);
    let geofenceResult = { isWithin: false, distance: null };

    if (!isNaN(userLat) && !isNaN(userLng)) {
      geofenceResult = isWithinGeofenceRange(userLat, userLng, currentClue.title || currentClue.targetLabel, coordRadiusMeters || 3.5);
      // If Coordinate Mapping is enabled by Admin and user is within 3-4 meters radius, auto-accept scan!
      if (coordMappingEnabled && geofenceResult.isWithin) {
        console.log(`🎯 GPS Geofence matched location within ${geofenceResult.distance}m (Radius: ${coordRadiusMeters || 3.5}m)`);
        isCorrect = true;
      }
    }

    // 4. Log Submission
    const submission = new Submission({
      team: team._id,
      clue: currentClue._id,
      photoUrl,
      mlResult: {
        predictedLabel,
        confidence,
        geofenceMatch: geofenceResult.isWithin,
        distanceMeters: geofenceResult.distance,
        raw: mlResponse
      },
      isCorrect
    });
    await submission.save();

    // Emit live submission log to Admin Dashboard via sockets
    const io = req.app.get("io");
    if (io) {
      try {
        const populatedSubmission = await Submission.findById(submission._id)
          .populate("team", "name")
          .populate("clue", "clueId title text order targetLabel zone")
          .lean();
        io.emit("submission:created", populatedSubmission);
        console.log("📡 Broadcasted new submission to Admin Dashboard:", submission._id, "isCorrect:", isCorrect);
      } catch (socketErr) {
        console.error("⚠️ Failed to broadcast submission socket event:", socketErr.message);
      }
    }

    // 5. Clean up temporary local file if Cloudinary or Supabase was used
    if (isSupabaseConfigured || isCloudinaryConfigured) {
      try {
        await fs.unlink(photoPath);
        console.log("🗑️ Local temporary file deleted:", photoPath);
      } catch (err) {
        console.warn("⚠️ Failed to delete local temp file:", err.message);
      }
    }

    // 6. Update Team Progress ONLY IF Correct
    if (isCorrect) {
      team.completedClues.push({
        clue: currentClue._id,
        photoUrl
      });
      team.score += currentClue.points;
      team.currentClueIndex += 1;

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
      } else {
        team.status = "in_progress";
      }

      await team.save();

      // Emit live leaderboard update via socket
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
        message: "Scan accepted.",
        isCorrect: true,
        nextClue: publicCluePayload(team, clues),
      });
    }

    return res.json({
      message: "Scan not accepted. Capture the location again.",
      isCorrect: false,
    });

  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ message: "Error processing image", error: error.message });
  }
};

// @route   POST /api/clues/report
// @desc    Submit an issue or feedback report during test mode / active run
export const submitReport = async (req, res) => {
  try {
    const team = await Team.findById(req.user.team);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const { category, message, clueTitle, coords } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Report description message is required" });
    }

    const report = new Report({
      team: team._id,
      teamName: team.name,
      category: category || "other",
      message: message.trim(),
      clueTitle: clueTitle || "N/A",
      coords: coords || null,
    });
    await report.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("report:created", report);
      console.log("📢 Broadcasted new feedback report from team:", team.name);
    }

    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (err) {
    console.error("Error submitting issue report:", err);
    res.status(500).json({ message: "Error submitting report", error: err.message });
  }
};


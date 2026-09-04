import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    teamNumber: { type: String, unique: true, sparse: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    
    currentClueIndex: { type: Number, default: 0 },
    cluePath: [
      {
        clue: { type: mongoose.Schema.Types.ObjectId, ref: "Clue" },
        assignedText: { type: String },
      },
    ],
    completedClues: [
      {
        clue: { type: mongoose.Schema.Types.ObjectId, ref: "Clue" },
        completedAt: { type: Date, default: Date.now },
        photoUrl: String,
      },
    ],
    score: { type: Number, default: 0 },
    startedAt: Date,
    finishedAt: Date,
    timerStartedAt: Date,
    timerStoppedAt: Date,
    timerAccumulatedMs: { type: Number, default: 0 },
    timerRunning: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "finished", "disqualified"],
      default: "not_started",
    },
    activeSessionToken: { type: String, default: null },

    
    location: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);

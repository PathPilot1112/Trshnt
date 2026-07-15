import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    
    currentClueIndex: { type: Number, default: 0 }, 
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

    
    location: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);

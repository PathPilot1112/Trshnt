import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["clue_discrepancy", "coordinate_error", "ml_false_rejection", "ui_lag", "other"],
      default: "other",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    clueTitle: {
      type: String,
      default: "N/A",
    },
    coords: {
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);

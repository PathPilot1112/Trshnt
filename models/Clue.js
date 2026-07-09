import mongoose from "mongoose";

const clueSchema = new mongoose.Schema(
  {
    clueId: { type: String, required: true, unique: true }, 
    order: { type: Number, required: true, unique: true }, 
    title: { type: String, required: true },
    text: { type: String, required: true }, 
    hint: { type: String },

    targetLabel: { type: String, required: true },

    confidenceThreshold: { type: Number, default: 0.75 },

    points: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Clue", clueSchema);

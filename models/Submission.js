import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    clue: { type: mongoose.Schema.Types.ObjectId, ref: "Clue", required: true },
    photoUrl: { type: String, required: true },

    mlResult: {
      predictedLabel: String,
      confidence: Number,
      raw: mongoose.Schema.Types.Mixed, 
    },

    isCorrect: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Submission", submissionSchema);

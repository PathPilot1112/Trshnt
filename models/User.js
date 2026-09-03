import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: { type: String, enum: ["admin", "player"], default: "player" },
    registerNumber: {
      type: String,
      required: function() { return this.role === 'player'; },
      unique: true,
      sparse: true
    },
    yearOfGraduation: {
      type: String,
      required: function() { return this.role === 'player'; }
    },
    course: {
      type: String,
      required: function() { return this.role === 'player'; }
    },
    specialization: {
      type: String,
      required: function() { return this.role === 'player'; }
    },
    contactNumber: {
      type: String,
      required: function() { return this.role === 'player'; },
      unique: true,
      sparse: true
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

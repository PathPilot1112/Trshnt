import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

export const seedDatabase = async () => {
  try {
    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_MAIL || "admintest@gmail.com";
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const admin = new User({
        name: "Admin Operator",
        email: adminEmail.toLowerCase(),
        role: "admin"
      });
      await admin.save();
      console.log("✅ Seeded Admin User:", adminEmail);
    }

    // 2. Seed Default Clues
    await Clue.deleteMany({}); // Clear existing clues for testing
    const defaultClues = [
      {
        clueId: "1",
        order: 1,
        title: "Clock tower",
        text: "Clock tower",
        hint: "Go to the Clock tower",
        targetLabel: "Clock tower",
        confidenceThreshold: 0.50,
        points: 100
      },
      {
        clueId: "2",
        order: 2,
        title: "Library",
        text: "Library",
        hint: "Go to the Library",
        targetLabel: "Library",
        confidenceThreshold: 0.50,
        points: 150
      },
      {
        clueId: "3",
        order: 3,
        title: "Ganesh Temple",
        text: "Ganesh Temple",
        hint: "Go to the Ganesh Temple",
        targetLabel: "Ganesh Temple",
        confidenceThreshold: 0.50,
        points: 200
      }
    ];

    await Clue.insertMany(defaultClues);
    console.log("✅ Seeded ML location Clues");

    // 3. Seed Default Teams (to populate the Admin Live Telemetry dashboard)
    const teamCount = await Team.countDocuments();
    if (teamCount === 0) {
      const defaultTeams = [
        {
          name: "TEAM_RENEGADE",
          status: "in_progress",
          startedAt: new Date(Date.now() - 42.2 * 60 * 60 * 1000), // ~42 hours ago
          score: 100,
          currentClueIndex: 1,
          location: {
            lat: 51.3892,
            lng: 30.0997,
            updatedAt: new Date()
          }
        },
        {
          name: "TEAM_MONOLITH",
          status: "in_progress",
          startedAt: new Date(Date.now() - 12.75 * 60 * 60 * 1000), // ~12 hours ago
          score: 0,
          currentClueIndex: 0,
          location: {
            lat: 51.4052,
            lng: 30.0561,
            updatedAt: new Date()
          }
        },
        {
          name: "TEAM_ECHO",
          status: "not_started",
          score: 0,
          currentClueIndex: 0
        }
      ];

      await Team.insertMany(defaultTeams);
      console.log("✅ Seeded default Teams for active operations telemetry");
    }
  } catch (err) {
    console.error("❌ Seeding database failed:", err.message);
  }
};

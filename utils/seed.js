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
    const clueCount = await Clue.countDocuments();
    if (clueCount === 0) {
      const defaultClues = [
        {
          clueId: "1",
          order: 1,
          title: "THE_RED_FOREST_ECHO",
          text: "Proceed to grid coordinates 51.3892° N, 30.0997° E. Find the rusted transponder buried beneath the blackened birch tree. Broadcast key code 402-DELTA-NINER to initiate the protocol.",
          hint: "Search near the coordinates on the edge of the forest.",
          targetLabel: "Artifact_A",
          confidenceThreshold: 0.75,
          points: 100
        },
        {
          clueId: "2",
          order: 2,
          title: "THE_PRIPIAT_CENTRAL_LINK",
          text: "Establish connection with Pripyat-Central at grid coordinates 51.4052° N, 30.0561° E. Recover the telemetry device from the abandoned school basement. Broadcast key code 88-ALPHA-SIERRA to sync.",
          hint: "Look inside the old locker next to the stairwell.",
          targetLabel: "Artifact_B",
          confidenceThreshold: 0.75,
          points: 150
        },
        {
          clueId: "3",
          order: 3,
          title: "THE_REACTOR_CORE_DATA",
          text: "Navigate to the reactor perimeter at grid coordinates 51.3915° N, 30.1034° E. Scan the radiation sensor junction box and enter key code 109-OMEGA-ZULU.",
          hint: "Behind the concrete shield wall.",
          targetLabel: "Artifact_C",
          confidenceThreshold: 0.80,
          points: 200
        }
      ];

      await Clue.insertMany(defaultClues);
      console.log("✅ Seeded default Clues");
    }

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

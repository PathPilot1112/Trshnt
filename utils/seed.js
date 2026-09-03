import Clue from "../models/Clue.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import fs from "fs/promises";
import path from "path";

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

    // 2. Seed Clues from clue.json (generated from Treasure Hunt Clues.xlsx)
    const clueCount = await Clue.countDocuments();
    if (clueCount === 0 || clueCount < 25) {
      await Clue.deleteMany({});
      const jsonPath = path.join(process.cwd(), "clue.json");
      const fileData = await fs.readFile(jsonPath, "utf8");
      const clueJsonData = JSON.parse(fileData);

      const cluesToInsert = clueJsonData.map((item, index) => ({
        clueId: item.clueid || String(index + 1),
        order: item.order || index + 1,
        title: item.title || item.location,
        text: item["clue text"] || item.text || item.clue_text,
        hint: item.hint || `Find location: ${item.title}`,
        zone: item.zone || "",
        targetLabel: item.targetLabel || item.title,
        confidenceThreshold: item.confidenceThreshold || 0.55,
        points: item.points || 100,
        clueVariations: item.clueVariations || []
      }));

      await Clue.insertMany(cluesToInsert);
      console.log(`✅ Seeded ${cluesToInsert.length} ML location Clues from clue.json`);
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

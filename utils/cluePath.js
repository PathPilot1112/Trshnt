import fs from "fs";
import path from "path";
import { getSystemState } from "./systemConfig.js";

// 1. Load routes from ROute.json or testRoutes.json
let cachedRoutes = null;
let cachedTestRoutes = null;

export const getRoutes = (forceTestMode = false) => {
  const { testDevMode } = getSystemState();
  const isTest = forceTestMode || testDevMode;

  if (isTest) {
    if (cachedTestRoutes) return cachedTestRoutes;
    try {
      const testRoutePath = path.join(process.cwd(), "testRoutes.json");
      const raw = fs.readFileSync(testRoutePath, "utf8");
      cachedTestRoutes = JSON.parse(raw);
      return cachedTestRoutes;
    } catch (err) {
      console.error("❌ Failed to read testRoutes.json:", err.message);
      return [];
    }
  }

  if (cachedRoutes) return cachedRoutes;
  try {
    const routePath = path.join(process.cwd(), "ROute.json");
    const raw = fs.readFileSync(routePath, "utf8");
    cachedRoutes = JSON.parse(raw);
    return cachedRoutes;
  } catch (err) {
    console.error("❌ Failed to read ROute.json:", err.message);
    return [];
  }
};

// 2. Location to Reward Item Dictionary
export const LOCATION_ITEMS = {
  "Clock Tower": {
    name: "Chrono Stabilizer",
    icon: "⏰",
    category: "timer",
    description: "Restores temporal stability and extends mission countdown timer."
  },
  "Genz": {
    name: "Survival Rations",
    icon: "🍕",
    category: "food",
    description: "Sustains team energy and keeps squad morale high."
  },
  "Gym": {
    name: "Stamina Booster",
    icon: "⚡",
    category: "stamina",
    description: "Increases physical agility and tactical movement speed."
  },
  "Sports Complex": {
    name: "Champion's Trophy",
    icon: "🏆",
    category: "stamina",
    description: "Boosts endurance and team movement velocity."
  },
  "Central Library": {
    name: "Intel Codex",
    icon: "📖",
    category: "intel",
    description: "Grants tactical clues and deciphers sector secrets."
  },
  "Fab Lab": {
    name: "Overclock Tool",
    icon: "🛠️",
    category: "tech",
    description: "Enhances optic scanner resolution and detection speed."
  },
  "Arts & Science Block": {
    name: "Bio-Shield Antidote",
    icon: "🧪",
    category: "research",
    description: "Protects squad from radiation anomalies."
  },
  "Law Block": {
    name: "Master Keycard",
    icon: "🔑",
    category: "protocol",
    description: "Bypasses sector security clearance locks."
  },
  "Dental College": {
    name: "Medical First-Aid Kit",
    icon: "💊",
    category: "health",
    description: "Restores vital health and squad integrity."
  },
  "Mahatma Gandhi Statue": {
    name: "Emblem of Hope",
    icon: "🕊️",
    category: "hope",
    description: "Inspires hope, unity, and squad morale in darkest sectors."
  },
  "Rajaraja Chola": {
    name: "Chola Sovereign Crest",
    icon: "👑",
    category: "relic",
    description: "Imbues royal strength and command authority."
  },
  "Periyar": {
    name: "Vision Aegis",
    icon: "👁️",
    category: "vision",
    description: "Sharpens optics to reveal hidden sector anomalies."
  },
  "Perignar Anna": {
    name: "Leader's Scroll",
    icon: "📜",
    category: "vision",
    description: "Guides squad navigation through uncharted sectors."
  },
  "Slice of Life": {
    name: "Vitality Elixir",
    icon: "🥤",
    category: "food",
    description: "Revitalizes squad focus and mental alertness."
  },
  "Sai Temple": {
    name: "Sacred Protection Shield",
    icon: "🛡️",
    category: "hope",
    description: "Surrounds team with protective sanctuary aura."
  },
  "Noon Meal Scheme (M Block)": {
    name: "Nutrient Rations Pack",
    icon: "🍱",
    category: "food",
    description: "Provides wholesome nourishment for long expeditions."
  },
  "Architecture Stonehenge": {
    name: "Structural Blueprint Decryptor",
    icon: "📐",
    category: "blueprint",
    description: "Unlocks ancient sector geometry maps."
  },
  "Architecture #SRM": {
    name: "Master Constructor Blueprint",
    icon: "🧱",
    category: "blueprint",
    description: "Decodes building structure layouts."
  },
  "Vendhar Square": {
    name: "Founder's Gold Coin",
    icon: "🪙",
    category: "relic",
    description: "Symbol of prestige and extra bonus resources."
  },
  "Aaruush Logo (TP)": {
    name: "Aaruush Power Core",
    icon: "⚡",
    category: "energy",
    description: "Supercharges team equipment battery life."
  },
  "#SRM (TP)": {
    name: "SRM Commendation Badge",
    icon: "🎖️",
    category: "badge",
    description: "Grants high-level security badge access."
  },
  "TP Auditorium Gate": {
    name: "Sector Gate Keycard",
    icon: "🚪",
    category: "protocol",
    description: "Unlocks grand auditorium perimeter gates."
  },
  "MBA Gate": {
    name: "Executive Access Token",
    icon: "💼",
    category: "protocol",
    description: "Bypasses business sector checkpoints."
  },
  "Bell Block": {
    name: "Siren Signal Repeater",
    icon: "🔔",
    category: "tech",
    description: "Emits alarm override signals across sectors."
  },
  "Pickleball Court": {
    name: "Agility Pulse Token",
    icon: "🎾",
    category: "stamina",
    description: "Sharpens team reflexes and reaction times."
  }
};

const DEFAULT_ITEM = {
  name: "Tactical Supply Pack",
  icon: "🎒",
  category: "supply",
  description: "Essential tactical gear and field supplies."
};

export const getItemForLocation = (locationName) => {
  if (!locationName) return DEFAULT_ITEM;
  if (LOCATION_ITEMS[locationName]) return LOCATION_ITEMS[locationName];

  // Alias / partial matching
  const cleanLoc = locationName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, item] of Object.entries(LOCATION_ITEMS)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanLoc.includes(cleanKey) || cleanKey.includes(cleanLoc)) {
      return item;
    }
  }
  return DEFAULT_ITEM;
};

// 3. Helper to clean string
const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Alias map for 4 locations with distinct names in clue.json
const LOCATION_ALIASES = {
  srmtp: ["srmlogo", "srmlogotp", "#srmlogotp"],
  architecturesrm: ["archsrm", "srmarchitectureblock", "architectureblock"],
  bellblock: ["belblock", "bellblock"],
  perignaranna: ["perarignaranna", "perignaranna", "anna"]
};

// 4. Find DB clue for a given location name
export const findClueForLocation = (locationName, clues) => {
  const locClean = cleanStr(locationName);
  const aliases = LOCATION_ALIASES[locClean] || [locClean];

  for (const clue of clues) {
    const cTitle = cleanStr(clue.title);
    const cLabel = cleanStr(clue.targetLabel);
    const cLoc = cleanStr(clue.zone || clue.location);
    const cAll = `${cTitle} ${cLabel} ${cLoc}`;

    for (const alias of aliases) {
      if (cAll.includes(alias) || alias.includes(cTitle) || (cTitle && cTitle.includes(alias))) {
        return clue;
      }
    }
  }

  // Fallback: search by partial text
  return (
    clues.find((c) => cleanStr(c.title).includes(locClean) || locClean.includes(cleanStr(c.title))) ||
    clues[Math.floor(Math.random() * clues.length)]
  );
};

// 5. Pick random clue variation
export const pickClueVariation = (clue) => {
  if (!clue) return "Locate the designated tactical anomaly within this sector.";
  const variations = (clue.clueVariations || []).filter((t) => typeof t === "string" && t.trim());
  if (variations.length === 0) return clue.text || clue["clue text"] || clue.clue_text || "Search the area.";
  return variations[Math.floor(Math.random() * variations.length)];
};

// 6. Assign route & build 5-location clue path for team
export const assignRouteToTeam = (team, selectedRouteId, clues) => {
  const routes = getRoutes();
  let route = null;

  if (selectedRouteId) {
    route = routes.find((r) => r.routeId === Number(selectedRouteId));
  }
  if (!route && routes.length > 0) {
    route = routes[Math.floor(Math.random() * routes.length)];
  }

  if (!route) {
    // Fallback if no routes found
    team.assignedRouteId = 1;
    team.assignedRouteName = "Route 1";
    team.routeLocations = [];
    team.cluePath = clues.slice(0, 5).map((clue) => ({
      clue: clue._id,
      locationName: clue.title || clue.targetLabel,
      assignedText: pickClueVariation(clue),
      rewardItem: getItemForLocation(clue.title)
    }));
    return team;
  }

  team.assignedRouteId = route.routeId;
  team.assignedRouteName = route.name;
  team.routeLocations = route.locations; // The 5 places

  const pathSteps = route.locations.map((locName) => {
    const clue = findClueForLocation(locName, clues);
    const assignedText = pickClueVariation(clue);
    const rewardItem = getItemForLocation(locName);

    return {
      clue: clue._id,
      locationName: locName,
      assignedText,
      rewardItem
    };
  });

  team.cluePath = pathSteps;
  team.currentClueIndex = 0;
  return team;
};

// 7. Legacy fallback wrapper
export const buildRandomCluePath = (clues) => {
  const dummyTeam = {};
  assignRouteToTeam(dummyTeam, null, clues);
  return dummyTeam.cluePath || [];
};

// 8. Ensure team has assigned route & path
export const ensureCluePath = async (team, clues) => {
  if (Array.isArray(team.cluePath) && team.cluePath.length === 5 && team.assignedRouteId) {
    return team;
  }
  assignRouteToTeam(team, team.assignedRouteId || null, clues);
  await team.save();
  return team;
};

// 9. Full public payload for HUD (returns full 5-quest path summary + inventory)
export const publicCluePayload = (team, clues) => {
  const pathSteps = team.cluePath || [];
  const currentIdx = team.currentClueIndex || 0;
  const isFinished = currentIdx >= pathSteps.length || team.status === "finished";

  const pathSummary = pathSteps.map((step, idx) => {
    const clueObj = clues.find((c) => String(c._id) === String(step.clue));
    const rewardItem = step.rewardItem || getItemForLocation(step.locationName);

    return {
      stepIndex: idx + 1,
      clueText: step.assignedText || clueObj?.text || "Locate designated tactical anomaly.",
      status: idx < currentIdx ? "cleared" : idx === currentIdx && !isFinished ? "active" : "locked",
      rewardItem,
    };
  });

  // Collected inventory items from cleared steps
  const inventory = pathSummary.filter((s) => s.status === "cleared").map((s) => s.rewardItem);

  if (isFinished) {
    return {
      finished: true,
      message: "All 5 sector objectives cleared!",
      step: pathSteps.length,
      total: pathSteps.length,
      pathSummary,
      inventory
    };
  }

  const currentStep = pathSteps[currentIdx];
  const clueObj = clues.find((c) => String(c._id) === String(currentStep?.clue));
  const rewardItem = currentStep?.rewardItem || getItemForLocation(currentStep?.locationName);

  return {
    finished: false,
    text: currentStep?.assignedText || clueObj?.text || "Locate designated target.",
    rewardItem,
    step: currentIdx + 1,
    total: pathSteps.length,
    pathSummary,
    inventory
  };
};

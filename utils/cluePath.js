export const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const pickClueVariation = (clue) => {
  const variations = (clue.clueVariations || []).filter((t) => typeof t === "string" && t.trim());
  if (variations.length === 0) return clue.text;
  return variations[Math.floor(Math.random() * variations.length)];
};

export const buildRandomCluePath = (clues) =>
  shuffleArray(clues).map((clue) => ({
    clue: clue._id,
    assignedText: pickClueVariation(clue),
  }));

export const ensureCluePath = async (team, clues) => {
  if (Array.isArray(team.cluePath) && team.cluePath.length === clues.length) {
    return team;
  }
  team.cluePath = buildRandomCluePath(clues);
  if (team.currentClueIndex > team.cluePath.length) {
    team.currentClueIndex = team.cluePath.length;
  }
  await team.save();
  return team;
};

export const publicCluePayload = (team, clues) => {
  if (team.currentClueIndex >= team.cluePath.length) {
    return { finished: true, message: "All clues completed" };
  }
  const step = team.cluePath[team.currentClueIndex];
  const clue = clues.find((c) => String(c._id) === String(step.clue));
  return {
    finished: false,
    text: step.assignedText || clue?.text,
    points: clue?.points || 100,
    step: team.currentClueIndex + 1,
    total: team.cluePath.length,
  };
};

// ── Score kills ───────────────────────────────────────────────────────────────
export function killScore(kills) {
  return (kills?.normal ?? 0) + (kills?.elite ?? 0) * 2 + (kills?.boss ?? 0) * 3;
}

// ── Résolution membre depuis snapshot ─────────────────────────────────────────
// Priorité : snapshot figé (session) → company live → playerNames anciens

export function resolveName(sc, idx, company, session) {
  const id = sc.playerStats?.[idx]?.memberId ?? sc.memberIds?.[idx] ?? session?.presentMemberIds?.[idx];
  if (id) {
    const snap = session?.memberSnapshot?.[id];
    if (snap) return typeof snap === "string" ? snap : snap.pseudo;
    const m = company?.members?.find(m => m.id === id);
    if (m) return m.pseudo;
  }
  return sc.playerNames?.[idx] ?? `J${idx + 1}`;
}

export function resolveChar(sc, idx, company, session) {
  const id = sc.playerStats?.[idx]?.memberId ?? sc.memberIds?.[idx] ?? session?.presentMemberIds?.[idx];
  if (id) {
    const snap = session?.memberSnapshot?.[id];
    if (snap && typeof snap === "object") return snap.activeCharacter ?? null;
    const m = company?.members?.find(m => m.id === id);
    if (m) return m.activeCharacter ?? null;
  }
  return null;
}

// ── Calcul scores MVP ─────────────────────────────────────────────────────────
// Retourne un tableau de scores bruts (un par joueur), dans le même ordre que playerStats
export function computeMVPScores(playerStats) {
  if (!playerStats?.length) return [];
  const totals = playerStats.map(ps => ({
    dmg:   ps.damageDealt ?? 0,
    taken: ps.damageTaken ?? 0,
    heal:  ps.healingDone ?? 0,
    kills: killScore(ps.kills),
  }));
  // Normalisation par catégorie : chaque stat divisée par le total du groupe.
  // Poids : dmg×2, taken×2, heal×2, kills×1 → max théorique = 7
  const totalDmg   = Math.max(totals.reduce((s, t) => s + t.dmg,   0), 1);
  const totalTaken = Math.max(totals.reduce((s, t) => s + t.taken, 0), 1);
  const totalHeal  = Math.max(totals.reduce((s, t) => s + t.heal,  0), 1);
  const totalKills = Math.max(totals.reduce((s, t) => s + t.kills, 0), 1);
  return totals.map(t =>
    t.dmg   / totalDmg   * 2 +
    t.taken / totalTaken * 2 +
    t.heal  / totalHeal  * 2 +
    t.kills / totalKills * 1
  );
}

// Retourne le nom du MVP ou null (ex-aequo → null)
export function computeMVP(playerStats, playerNames) {
  const scores = computeMVPScores(playerStats);
  if (!scores.length) return null;
  const sorted = scores.map((s, i) => ({ i, s })).sort((a, b) => b.s - a.s);
  if (sorted.length >= 2 && sorted[0].s === sorted[1].s) return null;
  return playerNames?.[sorted[0].i] ?? `J${sorted[0].i + 1}`;
}

// ── Titres (DPS / Tank / Heal / Bourreau) ────────────────────────────────────
// Retourne { [playerIndex]: ["dps", "tank", ...] }
export function computeTitles(playerStats) {
  if (!playerStats?.length) return {};
  const scores = playerStats.map((ps, i) => ({
    i,
    dmg:   ps.damageDealt ?? 0,
    taken: ps.damageTaken ?? 0,
    heal:  ps.healingDone ?? 0,
    kills: killScore(ps.kills),
  }));
  const titles = {};
  function addTitle(key, titleKey) {
    const sorted = [...scores].sort((a, b) => b[key] - a[key]);
    const best = sorted[0];
    if (best && best[key] > 0 && (sorted.length < 2 || sorted[1][key] < best[key])) {
      if (!titles[best.i]) titles[best.i] = [];
      titles[best.i].push(titleKey);
    }
  }
  addTitle("dmg",   "dps");
  addTitle("taken", "tank");
  addTitle("heal",  "heal");
  addTitle("kills", "bourreau");
  return titles;
}

// ── Agrégation stats d'une session par memberId ───────────────────────────────
// Retourne { [memberId]: { damageDealt, damageTaken, healingDone, kills: {normal, elite, boss} } }
export function aggregateSessionStats(session) {
  const aggById = {};
  for (const sc of (session?.scenarios ?? [])) {
    if (!sc.playerStats) continue;
    sc.playerStats.forEach((ps, i) => {
      const id = ps?.memberId ?? sc.memberIds?.[i] ?? session?.presentMemberIds?.[i];
      if (!id) return;
      if (!aggById[id]) aggById[id] = {
        damageDealt: 0, damageTaken: 0, healingDone: 0,
        kills: { normal: 0, elite: 0, boss: 0 },
      };
      aggById[id].damageDealt  += ps.damageDealt ?? 0;
      aggById[id].damageTaken  += ps.damageTaken ?? 0;
      aggById[id].healingDone  += ps.healingDone ?? 0;
      aggById[id].kills.normal += ps.kills?.normal ?? 0;
      aggById[id].kills.elite  += ps.kills?.elite  ?? 0;
      aggById[id].kills.boss   += ps.kills?.boss   ?? 0;
    });
  }
  return aggById;
}

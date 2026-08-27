// scratch/test_anti_clash.js

const sampleParticipants = [
  "ADRIL AND [HC: 3]",
  "ADRIL AND [HC: 3]",
  "AHLAN SALOPI [HC: 3]",
  "AHLAN SALOPI [HC: 3]",
  "ALDY SALOPI [HC: 3]",
  "ANDRY GOMES [HC: 3]",
  "ARIF VAMOS [HC: 3]",
  "AWAL PSC [HC: 3]",
  "BAHRIADI 59 [HC: 3]",
  "CING VAMOS [HC: 3]",
  "CING VAMOS [HC: 3]",
  "FARIZ VAMOS [HC: 3]",
  "FARIZ VAMOS [HC: 3]",
  "FATUL 59 [HC: 3]",
  "HAYYUL [HC: 3]",
  "ICCANK [HC: 3]",
  "IDRUS AND [HC: 3]",
  "MASPUR DONE [HC: 3]",
  "PHANTOM [HC: 3]",
  "PIAN 59 [HC: 3]",
  "PUTRA AND [HC: 3]",
  "RAFLI VAMOS [HC: 3]",
  "RAHMAT DONE [HC: 3]",
  "RAHMAT DONE [HC: 3]",
  "RAMS 59 [HC: 3]",
  "RAMS 59 [HC: 3]",
  "RIVAL AND [HC: 3]",
  "RIVAL AND [HC: 3]",
  "SAFAR SALOPI [HC: 3]",
  "SHAFA VAMOS [HC: 3]",
  "STARBOY [HC: 3]",
  "UCCANK RN [HC: 3]"
];

function cleanName(raw) {
  if (!raw) return '';
  return raw
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim();
}

function detectTeamsAndPersons(participants) {
  const cleanedList = participants.map((p, idx) => {
    const rawName = typeof p === 'string' ? p : (p.name || p.member?.name || `Player ${idx+1}`);
    const cleaned = cleanName(rawName);
    return {
      id: p.id || `p_${idx}`,
      raw: rawName,
      clean: cleaned,
      memberId: p.memberId || null,
      original: p
    };
  });

  const suffixCounts = new Map();
  const prefixCounts = new Map();

  cleanedList.forEach(p => {
    const words = p.clean.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) {
      const lastWord = words[words.length - 1].toUpperCase();
      const firstWord = words[0].toUpperCase();
      suffixCounts.set(lastWord, (suffixCounts.get(lastWord) || 0) + 1);
      prefixCounts.set(firstWord, (prefixCounts.get(firstWord) || 0) + 1);
    }
  });

  return cleanedList.map(p => {
    const words = p.clean.split(/\s+/).filter(w => w.length > 0);
    let team = null;

    const tagMatch = p.raw.match(/\(([a-zA-Z0-9_\s]+)\)|\[([a-zA-Z0-9_\s]+)\]/);
    if (tagMatch) {
      const tag = (tagMatch[1] || tagMatch[2]).trim().toUpperCase();
      if (!tag.startsWith('HC') && !tag.startsWith('HANDICAP') && tag.length >= 2) {
        team = tag;
      }
    }

    if (!team && words.length > 1) {
      const lastWord = words[words.length - 1].toUpperCase();
      const firstWord = words[0].toUpperCase();

      if (suffixCounts.get(lastWord) >= 2) {
        team = lastWord;
      } else if (prefixCounts.get(firstWord) >= 2) {
        team = firstWord;
      }
    }

    const personKey = p.memberId 
      ? `MEM_${p.memberId}` 
      : `NAME_${p.clean.toUpperCase()}`;

    return {
      ...p,
      team: team || 'INDIVIDUAL',
      personKey
    };
  });
}

function smartAntiClashSeeding(participants, bracketSize) {
  const annotated = detectTeamsAndPersons(participants);

  // Group by person to find twin slots
  const personGroups = new Map();
  annotated.forEach(p => {
    const list = personGroups.get(p.personKey) || [];
    list.push(p);
    personGroups.set(p.personKey, list);
  });

  const twinPairs = [];
  const singlePlayers = [];

  personGroups.forEach(list => {
    if (list.length >= 2) {
      twinPairs.push([list[0], list[1]]);
      for (let i = 2; i < list.length; i++) singlePlayers.push(list[i]);
    } else {
      singlePlayers.push(list[0]);
    }
  });

  // Sort single players by team so we can interleave them
  const teamGroups = new Map();
  singlePlayers.forEach(p => {
    const list = teamGroups.get(p.team) || [];
    list.push(p);
    teamGroups.set(p.team, list);
  });

  // Shuffle within team groups
  teamGroups.forEach(list => list.sort(() => Math.random() - 0.5));
  twinPairs.sort(() => Math.random() - 0.5);

  // We have N matches in Round 1 = bracketSize / 2
  // Slot 2m = Player 1 of Match m
  // Slot 2m + 1 = Player 2 of Match m
  // Top Half matches: 0 to (bracketSize/4 - 1)
  // Bottom Half matches: bracketSize/4 to (bracketSize/2 - 1)
  // Symmetrical match for match m is: (bracketSize/2 - 1 - m)
  // If Twin Slot 1 is in Match m (Slot 2m), Twin Slot 2 is in Match (bracketSize/2 - 1 - m) (Slot 2*(bracketSize/2 - 1 - m) + 1 = bracketSize - 1 - 2m).

  const slotMap = Array(bracketSize).fill(null);
  const matchCount = bracketSize / 2;

  // Let's create an array of match objects to manage constraints
  const matches = Array.from({ length: matchCount }, (_, i) => ({
    matchIndex: i,
    p1: null,
    p2: null,
    quadrant: Math.floor(i / (matchCount / 4)) // 0 (Q1), 1 (Q2), 2 (Q3), 3 (Q4)
  }));

  // Step 1: Assign Twin Pairs into Symmetrical Matches (Top Half vs Bottom Half)
  // We distribute twin pairs across available match indices in Top Half (0 .. matchCount/2 - 1)
  const topHalfIndices = Array.from({ length: Math.floor(matchCount / 2) }, (_, i) => i);
  topHalfIndices.sort(() => Math.random() - 0.5);

  for (let k = 0; k < twinPairs.length; k++) {
    const pair = twinPairs[k];
    const topMatchIdx = topHalfIndices[k % topHalfIndices.length];
    const bottomMatchIdx = matchCount - 1 - topMatchIdx;

    // Place slot 0 in Top Half (p1)
    matches[topMatchIdx].p1 = pair[0];
    // Place slot 1 in Bottom Half (p2)
    matches[bottomMatchIdx].p2 = pair[1];
  }

  // Step 2: Pool remaining unassigned participants (Single Players)
  // Gather all unplaced players
  const remainingPlayers = [];
  teamGroups.forEach(list => remainingPlayers.push(...list));
  remainingPlayers.sort(() => Math.random() - 0.5);

  // Separate largest teams first for best anti-clash placement
  const teamCountMap = new Map();
  remainingPlayers.forEach(p => teamCountMap.set(p.team, (teamCountMap.get(p.team) || 0) + 1));
  remainingPlayers.sort((a, b) => {
    const countA = a.team === 'INDIVIDUAL' ? 0 : (teamCountMap.get(a.team) || 0);
    const countB = b.team === 'INDIVIDUAL' ? 0 : (teamCountMap.get(b.team) || 0);
    return countB - countA;
  });

  // Collect all empty slots: { matchIdx, slot: 'p1' | 'p2' }
  const emptySlots = [];
  for (let i = 0; i < matchCount; i++) {
    if (!matches[i].p1) emptySlots.push({ matchIdx: i, slot: 'p1', quadrant: matches[i].quadrant });
    if (!matches[i].p2) emptySlots.push({ matchIdx: i, slot: 'p2', quadrant: matches[i].quadrant });
  }

  // Track team count per quadrant to keep teams balanced across quadrants
  const teamQuadrantCounts = new Map(); // `${team}_${quadrant}` => count
  const getTeamQuadCount = (team, q) => teamQuadrantCounts.get(`${team}_${q}`) || 0;
  const incTeamQuadCount = (team, q) => teamQuadrantCounts.set(`${team}_${q}`, getTeamQuadCount(team, q) + 1);

  // Initialize team quadrant counts from already placed twins
  matches.forEach(m => {
    if (m.p1 && m.p1.team !== 'INDIVIDUAL') incTeamQuadCount(m.p1.team, m.quadrant);
    if (m.p2 && m.p2.team !== 'INDIVIDUAL') incTeamQuadCount(m.p2.team, m.quadrant);
  });

  for (const player of remainingPlayers) {
    // Find best empty slot:
    // Criteria 1: Opponent in the same match must NOT be same team (unless INDIVIDUAL)
    // Criteria 2: Opponent must not be same person
    // Criteria 3: Minimize count of this team in this quadrant
    let bestSlotIdx = -1;
    let minConflictScore = Infinity;

    for (let s = 0; s < emptySlots.length; s++) {
      const { matchIdx, slot, quadrant } = emptySlots[s];
      const match = matches[matchIdx];
      const opponent = slot === 'p1' ? match.p2 : match.p1;

      let score = 0;
      if (opponent) {
        // Direct match clash check
        if (player.personKey === opponent.personKey) {
          score += 10000; // Never same person
        }
        if (player.team !== 'INDIVIDUAL' && player.team === opponent.team) {
          score += 5000; // Heavy penalty for same team clash in Round 1
        }
      }

      if (player.team !== 'INDIVIDUAL') {
        score += getTeamQuadCount(player.team, quadrant) * 10;
      }

      // Add a small random jitter to avoid deterministic slot patterns
      score += Math.random() * 2;

      if (score < minConflictScore) {
        minConflictScore = score;
        bestSlotIdx = s;
      }
    }

    if (bestSlotIdx !== -1) {
      const chosen = emptySlots.splice(bestSlotIdx, 1)[0];
      matches[chosen.matchIdx][chosen.slot] = player;
      if (player.team !== 'INDIVIDUAL') {
        incTeamQuadCount(player.team, chosen.quadrant);
      }
    }
  }

  // Populate slotMap
  for (let i = 0; i < matchCount; i++) {
    slotMap[i * 2] = matches[i].p1 ? matches[i].p1.original : null;
    slotMap[i * 2 + 1] = matches[i].p2 ? matches[i].p2.original : null;
  }

  return { slotMap, matches };
}

// Let's run a test simulation 100 times to verify 0% R1 clashes!
let totalR1Clashes = 0;
let totalTwinSeparationErrors = 0;

for (let sim = 0; sim < 100; sim++) {
  const { matches } = smartAntiClashSeeding(sampleParticipants, 32);
  
  matches.forEach(m => {
    if (m.p1 && m.p2) {
      const p1Obj = typeof m.p1 === 'string' ? m.p1 : m.p1.clean;
      const p2Obj = typeof m.p2 === 'string' ? m.p2 : m.p2.clean;
      const t1 = m.p1.team;
      const t2 = m.p2.team;
      if (t1 !== 'INDIVIDUAL' && t1 === t2) {
        totalR1Clashes++;
        console.error(`Sim ${sim} Match ${m.matchIndex+1} CLASH: ${p1Obj} vs ${p2Obj} (Team: ${t1})`);
      }
      if (m.p1.personKey === m.p2.personKey) {
        totalTwinSeparationErrors++;
        console.error(`Sim ${sim} Match ${m.matchIndex+1} TWIN ERROR: ${p1Obj} vs ${p2Obj}`);
      }
    }
  });
}

console.log(`Simulation complete!`);
console.log(`R1 Same Team Clashes: ${totalR1Clashes} / 1600 matches`);
console.log(`Twin Separation Errors: ${totalTwinSeparationErrors} / 1600 matches`);

// Print sample bracket
const { matches: sampleMatches } = smartAntiClashSeeding(sampleParticipants, 32);
console.log("\n--- SAMPLE ROUND 1 MATCHES (ANTI-CLASH) ---");
sampleMatches.forEach((m, idx) => {
  const p1 = m.p1 ? `${m.p1.clean} [${m.p1.team}]` : 'BYE';
  const p2 = m.p2 ? `${m.p2.clean} [${m.p2.team}]` : 'BYE';
  const half = idx < 8 ? 'POOL ATAS' : 'POOL BAWAH';
  const quad = `Q${m.quadrant+1}`;
  console.log(`Match #${(idx+1).toString().padStart(2, '0')} (${half} - ${quad}): ${p1.padEnd(25)} vs  ${p2}`);
});

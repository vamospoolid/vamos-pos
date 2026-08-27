// scratch/test_new_twin_convergence.js

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

function cleanParticipantName(raw) {
    if (!raw) return '';
    return raw
        .replace(/\[.*?\]|\(.*?\)/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

function detectTeamsAndPersons(participants) {
    const cleanedList = participants.map((p, idx) => {
        const rawName = typeof p === 'string' ? p : (p.name || p.member?.name || `Player ${idx + 1}`);
        const cleaned = cleanParticipantName(rawName);
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

            if ((suffixCounts.get(lastWord) || 0) >= 2) {
                team = lastWord;
            } else if ((prefixCounts.get(firstWord) || 0) >= 2) {
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

function smartShuffleAndSeed(participants, bracketSize) {
    const annotated = detectTeamsAndPersons(participants);

    // 1. Group by person to find twin slots
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

    const matchCount = Math.floor(bracketSize / 2);
    const quadrantSize = Math.max(1, Math.floor(matchCount / 4));
    
    // Convergence Block Configuration:
    // - 32 bracket: converge in SEMIFINAL (Block size = 8 matches, Q1 vs Q2, Q3 vs Q4)
    // - 64 bracket: converge in 8 BESAR (Block size = 8 matches, Blok 1 vs Blok 2)
    // - 128 bracket: converge in 16 BESAR (Block size = 8 matches, Sub-blok 1 vs Sub-blok 2)
    // - <= 16 bracket: converge in FINAL
    const convergenceBlockSize = 8;

    const blocks = [];
    for (let b = 0; b < matchCount; b += convergenceBlockSize) {
        const end = Math.min(matchCount, b + convergenceBlockSize);
        if (end - b >= 2) {
            blocks.push({ start: b, end });
        }
    }
    if (blocks.length === 0) {
        blocks.push({ start: 0, end: matchCount });
    }

    for (let attempt = 0; attempt < 20; attempt++) {
        const matches = Array.from({ length: matchCount }, (_, i) => ({
            matchIndex: i,
            p1: null,
            p2: null,
            quadrant: Math.floor(i / quadrantSize)
        }));

        // Sort twin pairs to alternate teams across blocks
        const shuffledTwinPairs = [...twinPairs].sort(() => Math.random() - 0.5);

        // Keep track of team counts per block so twins from same team don't stack in 1 block
        const teamBlockCounts = new Map();
        const getTeamBlockCount = (team, bIdx) => teamBlockCounts.get(`${team}_${bIdx}`) || 0;
        const incTeamBlockCount = (team, bIdx) => teamBlockCounts.set(`${team}_${bIdx}`, getTeamBlockCount(team, bIdx) + 1);

        for (const pair of shuffledTwinPairs) {
            const team = pair[0].team;
            // Choose block with lowest team count and least twin pairs
            let bestBlockIdx = 0;
            let minScore = Infinity;
            for (let b = 0; b < blocks.length; b++) {
                const score = (team !== 'INDIVIDUAL' ? getTeamBlockCount(team, b) * 10 : 0) + Math.random();
                if (score < minScore) {
                    minScore = score;
                    bestBlockIdx = b;
                }
            }

            if (team !== 'INDIVIDUAL') {
                incTeamBlockCount(team, bestBlockIdx);
            }

            const block = blocks[bestBlockIdx];
            const blockSize = block.end - block.start;
            const halfBlock = Math.floor(blockSize / 2);

            // Find match in first half without team conflict
            const availableFirstHalf = [];
            for (let m = block.start; m < block.start + halfBlock; m++) {
                if (!matches[m].p1) availableFirstHalf.push(m);
            }
            availableFirstHalf.sort(() => Math.random() - 0.5);
            const m1 = availableFirstHalf.length > 0 ? availableFirstHalf[0] : block.start;
            const m2 = block.start + (blockSize - 1 - (m1 - block.start));

            matches[m1].p1 = pair[0];
            matches[m2].p2 = pair[1];
        }

        // Pool remaining players
        const remainingPlayers = [...singlePlayers].sort(() => Math.random() - 0.5);
        const teamCountMap = new Map();
        remainingPlayers.forEach(p => teamCountMap.set(p.team, (teamCountMap.get(p.team) || 0) + 1));
        remainingPlayers.sort((a, b) => {
            const countA = a.team === 'INDIVIDUAL' ? 0 : (teamCountMap.get(a.team) || 0);
            const countB = b.team === 'INDIVIDUAL' ? 0 : (teamCountMap.get(b.team) || 0);
            return countB - countA;
        });

        const emptySlots = [];
        for (let i = 0; i < matchCount; i++) {
            if (!matches[i].p1) emptySlots.push({ matchIdx: i, slot: 'p1', quadrant: matches[i].quadrant });
            if (!matches[i].p2) emptySlots.push({ matchIdx: i, slot: 'p2', quadrant: matches[i].quadrant });
        }

        const teamQuadrantCounts = new Map();
        const getTeamQuadCount = (team, q) => teamQuadrantCounts.get(`${team}_${q}`) || 0;
        const incTeamQuadCount = (team, q) => teamQuadrantCounts.set(`${team}_${q}`, getTeamQuadCount(team, q) + 1);

        matches.forEach(m => {
            if (m.p1 && m.p1.team !== 'INDIVIDUAL') incTeamQuadCount(m.p1.team, m.quadrant);
            if (m.p2 && m.p2.team !== 'INDIVIDUAL') incTeamQuadCount(m.p2.team, m.quadrant);
        });

        let hasClash = false;
        for (const player of remainingPlayers) {
            let bestSlotIdx = -1;
            let minConflictScore = Infinity;

            for (let s = 0; s < emptySlots.length; s++) {
                const { matchIdx, slot, quadrant } = emptySlots[s];
                const match = matches[matchIdx];
                const opponent = slot === 'p1' ? match.p2 : match.p1;

                let score = 0;
                if (opponent) {
                    if (player.personKey === opponent.personKey) {
                        score += 10000000;
                    }
                    if (player.team !== 'INDIVIDUAL' && player.team === opponent.team) {
                        score += 5000000;
                    }
                }

                if (player.team !== 'INDIVIDUAL') {
                    score += getTeamQuadCount(player.team, quadrant) * 100;
                }

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
                const opp = chosen.slot === 'p1' ? matches[chosen.matchIdx].p2 : matches[chosen.matchIdx].p1;
                if (opp && player.team !== 'INDIVIDUAL' && player.team === opp.team) {
                    hasClash = true;
                }
            }
        }

        if (!hasClash || attempt === 19) {
            const slotMap = Array(bracketSize).fill(null);
            for (let i = 0; i < matchCount; i++) {
                slotMap[i * 2] = matches[i].p1 ? matches[i].p1.original : null;
                slotMap[i * 2 + 1] = matches[i].p2 ? matches[i].p2.original : null;
            }
            return { matches, slotMap };
        }
    }
}

// Run 500 simulations to verify 0 clashes
let clashes = 0;
let earlyTwinClashes = 0;

for (let i = 0; i < 500; i++) {
    const { matches: mList } = smartShuffleAndSeed(sampleParticipants, 32);
    mList.forEach(m => {
        if (m.p1 && m.p2) {
            if (m.p1.personKey === m.p2.personKey) {
                earlyTwinClashes++;
            }
            if (m.p1.team !== 'INDIVIDUAL' && m.p1.team === m.p2.team) {
                clashes++;
            }
        }
    });
}

console.log(`Simulation complete!`);
console.log(`Same team clashes in R1: ${clashes} / 8000 matches`);
console.log(`Twin clashes in R1: ${earlyTwinClashes} / 8000 matches`);

// Print sample
const { matches: sampleMatches } = smartShuffleAndSeed(sampleParticipants, 32);
console.log("\n--- SAMPLE ROUND 1 (SEMIFINAL CONVERGENCE) ---");
sampleMatches.forEach((m, idx) => {
    const p1 = m.p1 ? `${m.p1.clean} [${m.p1.team}]` : 'BYE';
    const p2 = m.p2 ? `${m.p2.clean} [${m.p2.team}]` : 'BYE';
    const zone = idx < 4 ? 'POOL A - Q1' : idx < 8 ? 'POOL A - Q2' : idx < 12 ? 'POOL B - Q3' : 'POOL B - Q4';
    console.log(`Match #${(idx+1).toString().padStart(2, '0')} (${zone}): ${p1.padEnd(25)} vs  ${p2}`);
});

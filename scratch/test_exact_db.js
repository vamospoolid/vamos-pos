// scratch/test_exact_db.js
const participants = [
  { id: '1', name: 'CING VAMOS' },
  { id: '2', name: 'CING VAMOS' },
  { id: '3', name: 'ADRIL AND' },
  { id: '4', name: 'ADRIL AND' },
  { id: '5', name: 'AHLAN SALOPI' },
  { id: '6', name: 'AHLAN SALOPI' },
  { id: '7', name: 'ALDY SALOPI' },
  { id: '8', name: 'ARDY GOMES' },
  { id: '9', name: 'ARIF VAMOS' },
  { id: '10', name: 'AWAL PSC' },
  { id: '11', name: 'BAHRIADI 59' },
  { id: '12', name: 'FARIZ VAMOS' },
  { id: '13', name: 'FARIZ VAMOS' },
  { id: '14', name: 'FATUL 59' },
  { id: '15', name: 'HAYYUL' },
  { id: '16', name: 'ICCANK' },
  { id: '17', name: 'IDRUS AND' },
  { id: '18', name: 'MASPUR DONE' },
  { id: '19', name: 'PHANTOM ' },
  { id: '20', name: 'PUTRA AND' },
  { id: '21', name: 'RAMS 59' },
  { id: '22', name: 'RAMS 59' },
  { id: '23', name: 'RIVAL AND' },
  { id: '24', name: 'RIVAL AND' },
  { id: '25', name: 'RIVAL AND' },
  { id: '26', name: 'SAFAR SALOPI' },
  { id: '27', name: 'STARBOY' },
  { id: '28', name: 'UCCANK RN' },
  { id: '29', name: 'RAHMAT DONE' },
  { id: '30', name: 'RAHMAT  DONE' },
  { id: '31', name: 'SHAVA VAMOS' },
  { id: '32', name: 'RIVAL VAMOS' }
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
        const rawName = p.name || p.member?.name || `Player ${idx + 1}`;
        const cleaned = cleanParticipantName(rawName);
        return {
            id: p.id,
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

    // 1. Group by person to find twin slots (same player taking 2 slots)
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

    // 2. Group singles by team
    const teamGroups = new Map();
    singlePlayers.forEach(p => {
        const list = teamGroups.get(p.team) || [];
        list.push(p);
        teamGroups.set(p.team, list);
    });

    teamGroups.forEach(list => list.sort(() => Math.random() - 0.5));
    twinPairs.sort(() => Math.random() - 0.5);

    const matchCount = Math.floor(bracketSize / 2);
    const quadrantSize = Math.max(1, Math.floor(matchCount / 4));
    const matches = Array.from({ length: matchCount }, (_, i) => ({
        matchIndex: i,
        p1: null,
        p2: null,
        quadrant: Math.floor(i / quadrantSize)
    }));

    // 3. Place Twin Pairs symmetrically: Slot in Top Half (Q1/Q2) vs Slot in Bottom Half (Q3/Q4)
    const topHalfIndices = Array.from({ length: Math.max(1, Math.floor(matchCount / 2)) }, (_, i) => i);
    topHalfIndices.sort(() => Math.random() - 0.5);

    for (let k = 0; k < twinPairs.length; k++) {
        const pair = twinPairs[k];
        const topMatchIdx = topHalfIndices[k % topHalfIndices.length];
        const bottomMatchIdx = matchCount - 1 - topMatchIdx;

        matches[topMatchIdx].p1 = pair[0];
        matches[bottomMatchIdx].p2 = pair[1];
    }

    // 4. Pool remaining unassigned participants (Single Players)
    const remainingPlayers = [];
    teamGroups.forEach(list => remainingPlayers.push(...list));
    remainingPlayers.sort(() => Math.random() - 0.5);

    // Sort teams with larger counts first for optimal anti-clash placement
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
                    score += 100000;
                }
                if (player.team !== 'INDIVIDUAL' && player.team === opponent.team) {
                    score += 50000;
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
        }
    }

    return matches;
}

let clashes = 0;
for (let i = 0; i < 500; i++) {
  const mList = smartShuffleAndSeed(participants, 32);
  mList.forEach(m => {
    if (m.p1 && m.p2) {
      if (m.p1.personKey === m.p2.personKey) {
        console.error(`TWIN CLASH on match ${m.matchIndex+1}: ${m.p1.clean} vs ${m.p2.clean}`);
        clashes++;
      }
      if (m.p1.team !== 'INDIVIDUAL' && m.p1.team === m.p2.team) {
        console.error(`TEAM CLASH on match ${m.matchIndex+1}: ${m.p1.clean} vs ${m.p2.clean} (${m.p1.team})`);
        clashes++;
      }
    }
  });
}
console.log('Total clashes in 500 runs:', clashes);

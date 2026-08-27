// Test with 20 participants in 32 bracket (12 BYEs)
const partialList = sampleParticipants.slice(0, 20);
console.log("\n--- TEST WITH 20 PLAYERS IN 32 BRACKET (12 BYEs) ---");
const { matches: byeMatches, slotMap: byeSlotMap } = smartAntiClashSeeding(partialList, 32);

byeMatches.forEach((m, idx) => {
  const p1 = m.p1 ? `${m.p1.clean} [${m.p1.team}]` : 'BYE';
  const p2 = m.p2 ? `${m.p2.clean} [${m.p2.team}]` : 'BYE';
  const half = idx < 8 ? 'POOL ATAS' : 'POOL BAWAH';
  console.log(`Match #${(idx+1).toString().padStart(2, '0')} (${half}): ${p1.padEnd(25)} vs  ${p2}`);
});

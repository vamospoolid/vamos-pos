const { jsPDF } = require('./node_modules/jspdf/dist/jspdf.node.min.js');
const fs = require('fs');

function generate2WingBracketPDF(tournament) {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    const colors = {
        primary: [37, 99, 235],       // #2563eb Blue
        secondary: [15, 23, 42],      // #0f172a Slate-900 (Dark text)
        muted: [100, 116, 139],       // #64748b Slate-500
        border: [203, 213, 225],      // #cbd5e1 Slate-300
        cardBg: [255, 255, 255],
        cardHeader: [241, 245, 249],  // #f1f5f9
        winner: [16, 185, 129],       // #10b981 Emerald
        accent: [234, 179, 8],        // #eab308 Gold
        goldBg: [254, 252, 232],
        goldBorder: [250, 204, 21],
        poolABg: [239, 246, 255],     // Light blue
        poolBBg: [254, 242, 242]      // Light rose/amber
    };

    // ─── 1. HEADER ───
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.8);
    doc.line(12, 22, pageWidth - 12, 22);

    // Left: Brand
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("VAMOS", 12, 14);

    doc.setFontSize(8);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("SMART ARENA POOL & CAFE", 42, 14);

    // Right: Tournament Info
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(tournament.name.toUpperCase(), pageWidth - 12, 12, { align: 'right' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'SABTU, 22 AGUSTUS 2026';
    doc.text(`${tournament.venue?.toUpperCase() || 'VAMOS SMART ARENA'} • ${dateStr.toUpperCase()} • 32 PLAYERS`, pageWidth - 12, 18, { align: 'right' });

    // ─── 2. SEPARATE MATCHES INTO POOL A (LEFT) & POOL B (RIGHT) ───
    const round1Matches = tournament.matches
        ? tournament.matches.filter(m => m.round === 1).sort((a, b) => a.matchNumber - b.matchNumber)
        : [];

    const totalR1 = round1Matches.length || 16;
    const halfR1 = Math.ceil(totalR1 / 2); // 8 for 32 bracket

    const startY = 32;
    const availableHeight = pageHeight - startY - 14; // ~164mm
    const cardHeight = 12;
    const cardWidth = 42;

    // Pool A Header (Left)
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(12, startY - 6, 88, 4.5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text("POOL A • BAGAN ATAS", 56, startY - 3, { align: 'center' });

    // Pool B Header (Right)
    doc.setFillColor(225, 29, 72); // Rose/Red
    doc.roundedRect(pageWidth - 100, startY - 6, 88, 4.5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text("POOL B • BAGAN BAWAH", pageWidth - 56, startY - 3, { align: 'center' });

    // Center Grand Final Header
    doc.setFillColor(234, 179, 8); // Gold
    doc.roundedRect(pageWidth / 2 - 22, startY - 6, 44, 4.5, 1, 1, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text("🏆 GRAND FINAL", pageWidth / 2, startY - 3, { align: 'center' });

    // Draw match helper
    const drawMatchBox = (m, x, y, width = cardWidth, height = cardHeight, isFinal = false) => {
        doc.setDrawColor(isFinal ? colors.goldBorder[0] : colors.border[0], isFinal ? colors.goldBorder[1] : colors.border[1], isFinal ? colors.goldBorder[2] : colors.border[2]);
        doc.setLineWidth(isFinal ? 0.4 : 0.2);
        doc.setFillColor(isFinal ? colors.goldBg[0] : 255, isFinal ? colors.goldBg[1] : 255, isFinal ? colors.goldBg[2] : 255);
        doc.roundedRect(x, y, width, height, 0.8, 0.8, 'FD');

        const p1Name = m?.p1Name || 'TBD';
        const p2Name = m?.p2Name || 'TBD';
        const p1Score = m?.score1 ?? 0;
        const p2Score = m?.score2 ?? 0;
        const p1Winner = m?.winnerId && m?.winnerId === m?.p1Id;
        const p2Winner = m?.winnerId && m?.winnerId === m?.p2Id;

        // Player 1 line
        doc.setFontSize(6.5);
        doc.setFont('helvetica', p1Winner ? 'bold' : 'normal');
        doc.setTextColor(p1Winner ? colors.winner[0] : colors.secondary[0], p1Winner ? colors.winner[1] : colors.secondary[1], p1Winner ? colors.winner[2] : colors.secondary[2]);
        let d1 = p1Name.toUpperCase();
        if (d1.length > 17) d1 = d1.substring(0, 15) + '..';
        doc.text(d1, x + 2, y + 4.2);
        doc.setFontSize(6.5);
        doc.text(String(p1Score), x + width - 2, y + 4.2, { align: 'right' });

        // Divider
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.15);
        doc.line(x + 1.5, y + 6, x + width - 1.5, y + 6);

        // Player 2 line
        doc.setFontSize(6.5);
        doc.setFont('helvetica', p2Winner ? 'bold' : 'normal');
        doc.setTextColor(p2Winner ? colors.winner[0] : colors.secondary[0], p2Winner ? colors.winner[1] : colors.secondary[1], p2Winner ? colors.winner[2] : colors.secondary[2]);
        let d2 = p2Name.toUpperCase();
        if (d2.length > 17) d2 = d2.substring(0, 15) + '..';
        doc.text(d2, x + 2, y + 10);
        doc.setFontSize(6.5);
        doc.text(String(p2Score), x + width - 2, y + 10, { align: 'right' });

        // Match number badge if round 1
        if (m?.matchNumber) {
            doc.setFillColor(colors.cardHeader[0], colors.cardHeader[1], colors.cardHeader[2]);
            doc.rect(x + width - 7, y, 7, 3, 'F');
            doc.setFontSize(4.5);
            doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
            doc.text(`#${m.matchNumber}`, x + width - 3.5, y + 2.2, { align: 'center' });
        }
    };

    const leftMatches = round1Matches.slice(0, halfR1);
    const rightMatches = round1Matches.slice(halfR1);

    const r1Spacing = availableHeight / halfR1; // ~20.5mm per match

    const leftPos = {};
    const rightPos = {};

    // Left Wing - Round 1 (x=12)
    leftMatches.forEach((m, idx) => {
        const x = 12;
        const y = startY + (idx * r1Spacing) + (r1Spacing / 2) - (cardHeight / 2);
        leftPos[`1_${idx}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
        drawMatchBox(m, x, y);
    });

    // Left Wing - Round 2 (x=52, 4 matches)
    for (let i = 0; i < 4; i++) {
        const x = 52;
        const m1Y = leftPos[`1_${i * 2}`].cy;
        const m2Y = leftPos[`1_${i * 2 + 1}`].cy;
        const y = (m1Y + m2Y) / 2 - cardHeight / 2;
        leftPos[`2_${i}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
        drawMatchBox({ p1Name: 'TBD', p2Name: 'TBD' }, x, y);

        // Connector lines from R1 to R2
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        const midX = (leftPos[`1_${i * 2}`].cx + x) / 2;
        doc.line(leftPos[`1_${i * 2}`].cx, m1Y, midX, m1Y);
        doc.line(leftPos[`1_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
        doc.line(midX, m1Y, midX, m2Y);
        doc.line(midX, (m1Y + m2Y) / 2, x, (m1Y + m2Y) / 2);
    }

    // Left Wing - Quarter Final (x=92, 2 matches)
    for (let i = 0; i < 2; i++) {
        const x = 92;
        const m1Y = leftPos[`2_${i * 2}`].cy;
        const m2Y = leftPos[`2_${i * 2 + 1}`].cy;
        const y = (m1Y + m2Y) / 2 - cardHeight / 2;
        leftPos[`3_${i}`] = { x, y, cx: x + cardWidth, cy: y + cardHeight / 2 };
        drawMatchBox({ p1Name: 'TBD', p2Name: 'TBD' }, x, y);

        // Connector lines from R2 to QF
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        const midX = (leftPos[`2_${i * 2}`].cx + x) / 2;
        doc.line(leftPos[`2_${i * 2}`].cx, m1Y, midX, m1Y);
        doc.line(leftPos[`2_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
        doc.line(midX, m1Y, midX, m2Y);
        doc.line(midX, (m1Y + m2Y) / 2, x, (m1Y + m2Y) / 2);
    }

    // Right Wing - Round 1 (x = pageWidth - 12 - cardWidth = 243)
    const rightX = pageWidth - 12 - cardWidth;
    rightMatches.forEach((m, idx) => {
        const x = rightX;
        const y = startY + (idx * r1Spacing) + (r1Spacing / 2) - (cardHeight / 2);
        rightPos[`1_${idx}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
        drawMatchBox(m, x, y);
    });

    // Right Wing - Round 2 (x = rightX - 40 = 203, 4 matches)
    for (let i = 0; i < 4; i++) {
        const x = rightX - 40;
        const m1Y = rightPos[`1_${i * 2}`].cy;
        const m2Y = rightPos[`1_${i * 2 + 1}`].cy;
        const y = (m1Y + m2Y) / 2 - cardHeight / 2;
        rightPos[`2_${i}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
        drawMatchBox({ p1Name: 'TBD', p2Name: 'TBD' }, x, y);

        // Connector lines from R1 to R2 on Right
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        const midX = (rightPos[`1_${i * 2}`].cx + x + cardWidth) / 2;
        doc.line(rightPos[`1_${i * 2}`].cx, m1Y, midX, m1Y);
        doc.line(rightPos[`1_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
        doc.line(midX, m1Y, midX, m2Y);
        doc.line(midX, (m1Y + m2Y) / 2, x + cardWidth, (m1Y + m2Y) / 2);
    }

    // Right Wing - Quarter Final (x = rightX - 80 = 163, 2 matches)
    for (let i = 0; i < 2; i++) {
        const x = rightX - 80;
        const m1Y = rightPos[`2_${i * 2}`].cy;
        const m2Y = rightPos[`2_${i * 2 + 1}`].cy;
        const y = (m1Y + m2Y) / 2 - cardHeight / 2;
        rightPos[`3_${i}`] = { x, y, cx: x, cy: y + cardHeight / 2 };
        drawMatchBox({ p1Name: 'TBD', p2Name: 'TBD' }, x, y);

        // Connector lines from R2 to QF on Right
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.3);
        const midX = (rightPos[`2_${i * 2}`].cx + x + cardWidth) / 2;
        doc.line(rightPos[`2_${i * 2}`].cx, m1Y, midX, m1Y);
        doc.line(rightPos[`2_${i * 2 + 1}`].cx, m2Y, midX, m2Y);
        doc.line(midX, m1Y, midX, m2Y);
        doc.line(midX, (m1Y + m2Y) / 2, x + cardWidth, (m1Y + m2Y) / 2);
    }

    // ─── CENTER: GRAND FINAL ───
    const leftSF_Y = (leftPos['3_0'].cy + leftPos['3_1'].cy) / 2;
    const rightSF_Y = (rightPos['3_0'].cy + rightPos['3_1'].cy) / 2;

    const finalWidth = 46;
    const finalHeight = 15;
    const finalX = (pageWidth - finalWidth) / 2;
    const finalY = (leftSF_Y + rightSF_Y) / 2 - finalHeight / 2;

    drawMatchBox({ p1Name: 'FINALIST POOL A', p2Name: 'FINALIST POOL B' }, finalX, finalY, finalWidth, finalHeight, true);

    // Left QF connectors to Final:
    const leftMidX = (leftPos['3_0'].cx + finalX) / 2;
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.4);
    doc.line(leftPos['3_0'].cx, leftPos['3_0'].cy, leftMidX, leftPos['3_0'].cy);
    doc.line(leftPos['3_1'].cx, leftPos['3_1'].cy, leftMidX, leftPos['3_1'].cy);
    doc.line(leftMidX, leftPos['3_0'].cy, leftMidX, leftPos['3_1'].cy);
    doc.line(leftMidX, leftSF_Y, finalX, leftSF_Y);

    // Right QF connectors to Final:
    const rightMidX = (rightPos['3_0'].cx + finalX + finalWidth) / 2;
    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.4);
    doc.line(rightPos['3_0'].cx, rightPos['3_0'].cy, rightMidX, rightPos['3_0'].cy);
    doc.line(rightPos['3_1'].cx, rightPos['3_1'].cy, rightMidX, rightPos['3_1'].cy);
    doc.line(rightMidX, rightPos['3_0'].cy, rightMidX, rightPos['3_1'].cy);
    doc.line(rightMidX, rightSF_Y, finalX + finalWidth, rightSF_Y);

    // ─── 3. FOOTER ───
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 9, pageWidth, 9, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
    doc.text(`TOTAL PARTICIPANTS: ${tournament.participants?.length || 32} SLOTS | FORMAT: SINGLE ELIMINATION (8-BALL)`, 12, pageHeight - 3.5);
    doc.text(`VAMOS SMART ARENA - OFFICIAL BRACKET SHEET | GENERATED: ${new Date().toLocaleString('id-ID')}`, pageWidth - 12, pageHeight - 3.5, { align: 'right' });

    return doc;
}

const sampleTournament = {
    name: 'FUN GAME VAMOS HC 3 SERIES 1',
    startDate: new Date('2026-08-22'),
    venue: 'VAMOS SMART ARENA POOL & CAFE',
    matches: [
        { matchNumber: 1, round: 1, p1Name: 'ALDY SALOPI', p2Name: 'IDRUS AND' },
        { matchNumber: 2, round: 1, p1Name: 'ADRIL AND', p2Name: 'MASPUR DONE' },
        { matchNumber: 3, round: 1, p1Name: 'FARIZ VAMOS', p2Name: 'UCCANK RN' },
        { matchNumber: 4, round: 1, p1Name: 'RAMS 59', p2Name: 'STARBOY' },
        { matchNumber: 5, round: 1, p1Name: 'RIVAL AND', p2Name: 'ARIF VAMOS' },
        { matchNumber: 6, round: 1, p1Name: 'CING VAMOS', p2Name: 'ICCANK' },
        { matchNumber: 7, round: 1, p1Name: 'AHLAN SALOPI', p2Name: 'ARDY GOMES' },
        { matchNumber: 8, round: 1, p1Name: 'RIVAL AND', p2Name: 'BAHRIADI 59' },
        { matchNumber: 9, round: 1, p1Name: 'AWAL PSC', p2Name: 'RIVAL AND' },
        { matchNumber: 10, round: 1, p1Name: 'RIVAL VAMOS', p2Name: 'AHLAN SALOPI' },
        { matchNumber: 11, round: 1, p1Name: 'PHANTOM', p2Name: 'CING VAMOS' },
        { matchNumber: 12, round: 1, p1Name: 'FATUL 59', p2Name: 'RAHMAT DONE' },
        { matchNumber: 13, round: 1, p1Name: 'SAFAR SALOPI', p2Name: 'RAMS 59' },
        { matchNumber: 14, round: 1, p1Name: 'HAYYUL', p2Name: 'FARIZ VAMOS' },
        { matchNumber: 15, round: 1, p1Name: 'SHAVA VAMOS', p2Name: 'ADRIL AND' },
        { matchNumber: 16, round: 1, p1Name: 'RAHMAT DONE', p2Name: 'PUTRA AND' },
    ]
};

const doc = generate2WingBracketPDF(sampleTournament);
fs.writeFileSync('../scratch/bracket_sample.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('PDF generated successfully at scratch/bracket_sample.pdf');

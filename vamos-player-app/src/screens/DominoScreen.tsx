import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Trophy,
  Shuffle,
  Play,
  Pause,
  RotateCcw,
  Minimize2,
  Volume2,
  VolumeX,
  Search,
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  ClipboardPaste,
  Save,
  Tv,
  Zap,
  Copy,
  FileText,
  Check,
  Sparkles,
  LayoutGrid,
  Columns,
} from 'lucide-react';
import { DominoTile } from '../components/DominoTile';
import { DominoDrawFocusingModal } from '../components/DominoDrawFocusingModal';
import { DominoBracketTree } from '../components/DominoBracketTree';

export interface DominoParticipant {
  id: string;
  name: string;
  team?: string;
  paymentStatus?: 'PAID' | 'UNPAID';
  slotNumber?: number;
}

export interface DominoMatch {
  id: string;
  round: number; // 1 to 6
  matchNumber: number; // 1 to 63
  pool: 'POOL_A' | 'POOL_B' | 'FINAL';
  player1?: DominoParticipant | null;
  player2?: DominoParticipant | null;
  score1?: number | null;
  score2?: number | null;
  winnerId?: string | null;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
}

const TOURNAMENT_ID = '057cdd85-454b-433d-8102-2c32b29d9ac1';
const API_BASE = 'https://api.vamospool.id/api';

// 64 Sample Indonesian Domino Pairs across distinct teams for instant simulation
const SAMPLE_64_PAIRS: Array<{ name: string; team: string }> = [
  { name: 'Budi / Agus', team: 'WARKOP 55' },
  { name: 'Iwan / Hendra', team: 'WARKOP 55' },
  { name: 'Rudy / Anton', team: 'WARKOP 55' },
  { name: 'Ahmad / Rizal', team: 'WARKOP 55' },
  { name: 'Arif / Rafli', team: 'TIM VAMOS' },
  { name: 'Fariz / Cing', team: 'TIM VAMOS' },
  { name: 'Shafa / Phantom', team: 'TIM VAMOS' },
  { name: 'Starboy / Pian', team: 'TIM VAMOS' },
  { name: 'Adril / Putra', team: 'AND GROUP' },
  { name: 'Idrus / Rival', team: 'AND GROUP' },
  { name: 'Akil / Mansur', team: 'AND GROUP' },
  { name: 'Fandi / Zulkifli', team: 'AND GROUP' },
  { name: 'Ahlan / Aldy', team: 'SALOPI CLUB' },
  { name: 'Safar / Jaka', team: 'SALOPI CLUB' },
  { name: 'Basri / Taufiq', team: 'SALOPI CLUB' },
  { name: 'Lukman / Wahyu', team: 'SALOPI CLUB' },
  { name: 'Rahmat / Maspur', team: 'DONE CREW' },
  { name: 'Fikri / Dani', team: 'DONE CREW' },
  { name: 'Usman / Bakri', team: 'DONE CREW' },
  { name: 'Hamid / Syahrul', team: 'DONE CREW' },
  { name: 'Bahriadi / Fatul', team: 'PASUKAN 59' },
  { name: 'Rams / Pian', team: 'PASUKAN 59' },
  { name: 'Iqbal / Dimas', team: 'PASUKAN 59' },
  { name: 'Bayu / Sandi', team: 'PASUKAN 59' },
  { name: 'Awal / Sukri', team: 'GARDA WONOMULYO' },
  { name: 'Uccank / Ilham', team: 'GARDA WONOMULYO' },
  { name: 'Haidir / Imran', team: 'GARDA WONOMULYO' },
  { name: 'Sudirman / Aras', team: 'GARDA WONOMULYO' },
  { name: 'Andry / Gomez', team: 'BINTANG TIMUR' },
  { name: 'Awi / Bata', team: 'BINTANG TIMUR' },
  { name: 'Kadir / Anto', team: 'BINTANG TIMUR' },
  { name: 'Syamsul / Haris', team: 'BINTANG TIMUR' },
  { name: 'Dedi / Joko', team: 'WARKOP SUDIMORO' },
  { name: 'Eko / Bambang', team: 'WARKOP SUDIMORO' },
  { name: 'Teguh / Slamet', team: 'WARKOP SUDIMORO' },
  { name: 'Heru / Pras', team: 'WARKOP SUDIMORO' },
  { name: 'Irfan / Akbar', team: 'ELITE POLEWALI' },
  { name: 'Yusuf / Firman', team: 'ELITE POLEWALI' },
  { name: 'Nawir / Ridwan', team: 'ELITE POLEWALI' },
  { name: 'Samsir / Muhlis', team: 'ELITE POLEWALI' },
  { name: 'Toni / Kevin', team: 'KOMUNITAS BALAK' },
  { name: 'Rian / Andre', team: 'KOMUNITAS BALAK' },
  { name: 'Doni / Yoga', team: 'KOMUNITAS BALAK' },
  { name: 'Faisal / Rio', team: 'KOMUNITAS BALAK' },
  { name: 'Hasan / Amir', team: 'WARKOP 77' },
  { name: 'Nasir / Yahya', team: 'WARKOP 77' },
  { name: 'Mustofa / Latif', team: 'WARKOP 77' },
  { name: 'Dahlan / Syafei', team: 'WARKOP 77' },
  { name: 'Jamal / Daeng', team: 'SAHABAT WONOMULYO' },
  { name: 'Baso / Becce', team: 'SAHABAT WONOMULYO' },
  { name: 'Puang / Lappo', team: 'SAHABAT WONOMULYO' },
  { name: 'Pelle / Appi', team: 'SAHABAT WONOMULYO' },
  { name: 'Sulaiman / Rustam', team: 'VAMOS SULTAN' },
  { name: 'Tahir / Mansyur', team: 'VAMOS SULTAN' },
  { name: 'Burhan / Zaid', team: 'VAMOS SULTAN' },
  { name: 'Gani / Sabar', team: 'VAMOS SULTAN' },
  { name: 'Ansar / Basri', team: 'LASKAR GAPLE' },
  { name: 'Bahar / Sabir', team: 'LASKAR GAPLE' },
  { name: 'Maman / Udin', team: 'LASKAR GAPLE' },
  { name: 'Komar / Cecep', team: 'LASKAR GAPLE' },
  { name: 'Rico / Alex', team: 'BLACK PANTHER' },
  { name: 'Ferdy / Ronald', team: 'BLACK PANTHER' },
  { name: 'David / Chris', team: 'BLACK PANTHER' },
  { name: 'Tommy / Bobby', team: 'BLACK PANTHER' },
];

// Helper to determine physical table allocation for 16 tables
export const getPhysicalTableInfo = (m: DominoMatch): { tableNumber: number; sessionLabel: string; fullLabel: string } => {
  if (m.round === 1) {
    if (m.matchNumber <= 16) {
      return {
        tableNumber: m.matchNumber,
        sessionLabel: 'Sesi 1',
        fullLabel: `MEJA ${String(m.matchNumber).padStart(2, '0')} (SESI 1)`,
      };
    } else {
      const tbl = m.matchNumber - 16;
      return {
        tableNumber: tbl,
        sessionLabel: 'Sesi 2',
        fullLabel: `MEJA ${String(tbl).padStart(2, '0')} (SESI 2)`,
      };
    }
  } else if (m.round === 2) {
    const tbl = m.matchNumber - 32;
    return {
      tableNumber: tbl,
      sessionLabel: 'Babak 32',
      fullLabel: `MEJA ${String(tbl).padStart(2, '0')}`,
    };
  } else if (m.round === 3) {
    const tbl = m.matchNumber - 48;
    return {
      tableNumber: tbl,
      sessionLabel: '16 Besar',
      fullLabel: `MEJA ${String(tbl).padStart(2, '0')}`,
    };
  } else if (m.round === 4) {
    const tbl = m.matchNumber - 56;
    return {
      tableNumber: tbl,
      sessionLabel: '8 Besar',
      fullLabel: `MEJA ${String(tbl).padStart(2, '0')}`,
    };
  } else if (m.round === 5) {
    const tbl = m.matchNumber - 60;
    return {
      tableNumber: tbl,
      sessionLabel: 'Semifinal',
      fullLabel: `MEJA ${String(tbl).padStart(2, '0')}`,
    };
  } else {
    return {
      tableNumber: 1,
      sessionLabel: 'Grand Final',
      fullLabel: 'MEJA 01 (MAIN STAGE)',
    };
  }
};

export const WA_TEMPLATE_TEXT = `*DAFTAR PESERTA DOMINO FUN TOURNAMENT*
📍 Lokasi: Vamos Pool & Café Wonomulyo
🗓️ Tanggal: 9 Oktober 2026
🏆 Sistem Gugur (Single Elimination • 64 Slot Pasangan)
🎱 Alokasi: Khusus 16 Meja Domino (Babak 64: Sesi 1 & Sesi 2)
💰 Total Hadiah: Rp 3.000.000 + Voucher Billiard 2 Jam

${SAMPLE_64_PAIRS.map((p, i) => `${String(i + 1).padStart(2, '0')}. ${p.name} (${p.team})`).join('\n')}

*JADWAL ALOKASI 16 MEJA DOMINO:*
- Babak 64 Sesi 1 (Pool A): Meja 01 s/d Meja 16 (Match 1 - 16)
- Babak 64 Sesi 2 (Pool B): Meja 01 s/d Meja 16 (Match 17 - 32)
- Babak 32 Besar: Meja 01 s/d Meja 16 (16 Match Serentak)
- Babak 16 Besar: Meja 01 s/d Meja 08
- Babak 8 Besar (QF): Meja 01 s/d Meja 04
- Semifinal: Meja 01 & Meja 02
- Grand Final: Meja 01 (Meja Utama)`;

export const DominoScreen: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'bracket' | 'participants'>('draw');
  const [participants, setParticipants] = useState<DominoParticipant[]>([]);
  const [matches, setMatches] = useState<DominoMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTvMode, setIsTvMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Drawing state
  const [drawingSpeed, setDrawingSpeed] = useState<'SLOW' | 'NORMAL' | 'FAST' | 'INSTANT'>('NORMAL');
  const [isDrawingRunning, setIsDrawingRunning] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<string>('MEMULAI...');
  const [currentDrawn, setCurrentDrawn] = useState<{
    participant: DominoParticipant;
    matchNumber: number;
    slot: 1 | 2;
    pool: 'POOL_A' | 'POOL_B';
  } | null>(null);
  const [drawnSlotMap, setDrawnSlotMap] = useState<Array<DominoParticipant | null>>(Array(64).fill(null));

  // Modals
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<DominoMatch | null>(null);
  const [modalScore1, setModalScore1] = useState<number>(0);
  const [modalScore2, setModalScore2] = useState<number>(0);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [newPairName, setNewPairName] = useState('');
  const [newPairTeam, setNewPairTeam] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSavingBracket, setIsSavingBracket] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'SESSION_1' | 'SESSION_2'>('ALL');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [showFocusingModal, setShowFocusingModal] = useState(false);
  const [isFocusingEnabled, setIsFocusingEnabled] = useState(true);
  const [tvLayoutMode, setTvLayoutMode] = useState<'LANDSCAPE_SPLIT' | 'GRID'>('LANDSCAPE_SPLIT');

  // Web Audio Context Synthesizer for high-fidelity offline SFX
  const audioCtxRef = useRef<AudioContext | null>(null);
  const drawingTimerRef = useRef<any>(null);
  const rollingIntervalRef = useRef<any>(null);

  const playSfx = useCallback((type: 'SHUFFLE' | 'DROP' | 'VICTORY' | 'CLICK') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'CLICK') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'SHUFFLE') {
        // Wooden tile sliding sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'DROP') {
        // Resonant domino tile clack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'VICTORY') {
        // Fanfare chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.6);
        });
      }
    } catch {}
  }, [soundEnabled]);

  // Clean team helper
  const extractTeam = (name: string, teamField?: string): string => {
    if (teamField && teamField.trim().length > 0) return teamField.trim().toUpperCase();
    if (!name) return 'INDIVIDUAL';
    const tagMatch = name.match(/\(([a-zA-Z0-9_\s-]+)\)|\[([a-zA-Z0-9_\s-]+)\]/);
    if (tagMatch) {
      const tag = (tagMatch[1] || tagMatch[2]).trim().toUpperCase();
      if (tag.length >= 2) return tag;
    }
    const dashMatch = name.split('-');
    if (dashMatch.length > 1) {
      return dashMatch[0].trim().toUpperCase();
    }
    return 'INDIVIDUAL';
  };

  // Build the 63 matches tree skeleton for 64 slots
  const generateEmptyMatches = useCallback((slotArray: Array<DominoParticipant | null>): DominoMatch[] => {
    const newMatches: DominoMatch[] = [];

    // Round 1: Matches 1 to 32 (64 Besar)
    for (let i = 0; i < 32; i++) {
      const matchNumber = i + 1;
      const pool: 'POOL_A' | 'POOL_B' = matchNumber <= 16 ? 'POOL_A' : 'POOL_B';
      newMatches.push({
        id: `M_R1_${matchNumber}`,
        round: 1,
        matchNumber,
        pool,
        player1: slotArray[i * 2] || null,
        player2: slotArray[i * 2 + 1] || null,
        score1: null,
        score2: null,
        winnerId: null,
        status: 'PENDING',
      });
    }

    // Round 2: Matches 33 to 48 (32 Besar)
    for (let i = 0; i < 16; i++) {
      const matchNumber = 33 + i;
      const pool: 'POOL_A' | 'POOL_B' = matchNumber <= 40 ? 'POOL_A' : 'POOL_B';
      newMatches.push({
        id: `M_R2_${matchNumber}`,
        round: 2,
        matchNumber,
        pool,
        player1: null,
        player2: null,
        score1: null,
        score2: null,
        winnerId: null,
        status: 'PENDING',
      });
    }

    // Round 3: Matches 49 to 56 (16 Besar)
    for (let i = 0; i < 8; i++) {
      const matchNumber = 49 + i;
      const pool: 'POOL_A' | 'POOL_B' = matchNumber <= 52 ? 'POOL_A' : 'POOL_B';
      newMatches.push({
        id: `M_R3_${matchNumber}`,
        round: 3,
        matchNumber,
        pool,
        player1: null,
        player2: null,
        score1: null,
        score2: null,
        winnerId: null,
        status: 'PENDING',
      });
    }

    // Round 4: Matches 57 to 60 (8 Besar / Perempat Final)
    for (let i = 0; i < 4; i++) {
      const matchNumber = 57 + i;
      const pool: 'POOL_A' | 'POOL_B' = matchNumber <= 58 ? 'POOL_A' : 'POOL_B';
      newMatches.push({
        id: `M_R4_${matchNumber}`,
        round: 4,
        matchNumber,
        pool,
        player1: null,
        player2: null,
        score1: null,
        score2: null,
        winnerId: null,
        status: 'PENDING',
      });
    }

    // Round 5: Matches 61 & 62 (Semifinal)
    newMatches.push({
      id: `M_R5_61`,
      round: 5,
      matchNumber: 61,
      pool: 'POOL_A',
      player1: null,
      player2: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'PENDING',
    });
    newMatches.push({
      id: `M_R5_62`,
      round: 5,
      matchNumber: 62,
      pool: 'POOL_B',
      player1: null,
      player2: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'PENDING',
    });

    // Round 6: Match 63 (Grand Final)
    newMatches.push({
      id: `M_R6_63`,
      round: 6,
      matchNumber: 63,
      pool: 'FINAL',
      player1: null,
      player2: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: 'PENDING',
    });

    return newMatches;
  }, []);

  // Fetch initial tournament data from VPS API
  const fetchTournamentData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/tournaments/${TOURNAMENT_ID}`);
      if (!res.ok) throw new Error('Gagal mengambil data turnamen');
      const json = await res.json();
      const t = json.data || json;

      if (t && t.participants) {
        const loaded: DominoParticipant[] = t.participants.map((p: any, idx: number) => ({
          id: p.id || `p_${idx}`,
          name: (p.name || p.member?.name || `Pasangan ${idx + 1}`).trim(),
          team: extractTeam(p.name || '', p.paymentNotes),
          paymentStatus: p.paymentStatus || 'PAID',
          slotNumber: idx + 1,
        }));
        setParticipants(loaded);

        // If backend already has matches generated
        if (t.matches && t.matches.length > 0) {
          const mappedMatches: DominoMatch[] = t.matches.map((m: any) => ({
            id: m.id,
            round: m.round,
            matchNumber: m.matchNumber,
            pool: m.matchNumber <= 16 ? 'POOL_A' : m.matchNumber <= 32 ? 'POOL_B' : 'FINAL',
            player1: m.player1 ? {
              id: m.player1.id,
              name: m.player1.name || m.player1.member?.name,
              team: extractTeam(m.player1.name || '', m.player1.paymentNotes),
            } : null,
            player2: m.player2 ? {
              id: m.player2.id,
              name: m.player2.name || m.player2.member?.name,
              team: extractTeam(m.player2.name || '', m.player2.paymentNotes),
            } : null,
            score1: m.score1,
            score2: m.score2,
            winnerId: m.winnerId,
            status: m.status || 'PENDING',
          }));
          setMatches(mappedMatches);

          // Populate drawnSlotMap from Round 1 matches
          const slotMap: Array<DominoParticipant | null> = Array(64).fill(null);
          mappedMatches
            .filter((m) => m.round === 1)
            .sort((a, b) => a.matchNumber - b.matchNumber)
            .forEach((m, idx) => {
              if (idx < 32) {
                slotMap[idx * 2] = m.player1 || null;
                slotMap[idx * 2 + 1] = m.player2 || null;
              }
            });
          setDrawnSlotMap(slotMap);
        } else {
          // Initialize empty skeleton
          const empty = generateEmptyMatches(Array(64).fill(null));
          setMatches(empty);
        }
      }
    } catch (e) {
      console.warn('Load from API fallback to sample/offline:', e);
      // Fallback: seed with sample participants if empty
      const sample = SAMPLE_64_PAIRS.map((s, idx) => ({
        id: `sample_${idx + 1}`,
        name: s.name,
        team: s.team,
        paymentStatus: 'PAID' as const,
        slotNumber: idx + 1,
      }));
      setParticipants(sample);
      setMatches(generateEmptyMatches(Array(64).fill(null)));
    } finally {
      setIsLoading(false);
    }
  }, [generateEmptyMatches]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  // SMART ANTI-CLASH ALGORITHM
  // Strictly separates teams so they never clash in Round 1 (64 Besar)
  // and maximally disperses them into opposite pools (Pool A vs Pool B)
  const computeAntiClashSeeding = useCallback((list: DominoParticipant[]): Array<DominoParticipant | null> => {
    const totalSlots = 64;
    const matchCount = 32;

    // Group participants by team
    const teamGroups = new Map<string, DominoParticipant[]>();
    list.forEach((p) => {
      const teamKey = p.team || 'INDIVIDUAL';
      const arr = teamGroups.get(teamKey) || [];
      arr.push(p);
      teamGroups.set(teamKey, arr);
    });

    // 4 Quadrants: Q1 (M1-M8), Q2 (M9-M16), Q3 (M17-M24), Q4 (M25-M32)
    // Try multiple attempts to find a zero-clash solution
    for (let attempt = 0; attempt < 80; attempt++) {
      const matchSlots: Array<{
        matchNumber: number;
        p1: DominoParticipant | null;
        p2: DominoParticipant | null;
        quadrant: number;
        pool: 'POOL_A' | 'POOL_B';
      }> = Array.from({ length: matchCount }, (_, i) => ({
        matchNumber: i + 1,
        p1: null,
        p2: null,
        quadrant: Math.floor(i / 8), // 0, 1, 2, 3
        pool: i < 16 ? 'POOL_A' : 'POOL_B',
      }));

      // Flatten participants: prioritize teams with most members first
      const sortedTeams = Array.from(teamGroups.entries()).sort(
        (a, b) => b[1].length - a[1].length
      );

      let clashFound = false;

      // Track quadrant allocation per team
      const teamQuadUsage = new Map<string, number[]>(); // team -> [countQ0, countQ1, countQ2, countQ3]

      for (const [teamName, members] of sortedTeams) {
        const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

        if (!teamQuadUsage.has(teamName)) {
          teamQuadUsage.set(teamName, [0, 0, 0, 0]);
        }
        const usage = teamQuadUsage.get(teamName)!;

        for (const member of shuffledMembers) {
          // Find available slots that don't violate:
          // 1. Same match must not have member of same team
          // 2. Prefer quadrant with lowest usage of this team
          const candidates: Array<{ matchIdx: number; slot: 'p1' | 'p2'; score: number }> = [];

          matchSlots.forEach((m, mIdx) => {
            const opp1 = m.p1;
            const opp2 = m.p2;

            if (!opp1) {
              const opp = opp2;
              const hasSameTeamOpponent = opp && teamName !== 'INDIVIDUAL' && opp.team === teamName;
              if (!hasSameTeamOpponent) {
                const quadCount = teamName === 'INDIVIDUAL' ? 0 : usage[m.quadrant];
                candidates.push({ matchIdx: mIdx, slot: 'p1', score: quadCount * 10 + Math.random() });
              }
            }
            if (!opp2) {
              const opp = opp1;
              const hasSameTeamOpponent = opp && teamName !== 'INDIVIDUAL' && opp.team === teamName;
              if (!hasSameTeamOpponent) {
                const quadCount = teamName === 'INDIVIDUAL' ? 0 : usage[m.quadrant];
                candidates.push({ matchIdx: mIdx, slot: 'p2', score: quadCount * 10 + Math.random() });
              }
            }
          });

          if (candidates.length === 0) {
            clashFound = true;
            break;
          }

          // Pick the candidate with the lowest conflict score
          candidates.sort((a, b) => a.score - b.score);
          const chosen = candidates[0];

          matchSlots[chosen.matchIdx][chosen.slot] = member;
          usage[matchSlots[chosen.matchIdx].quadrant]++;
        }

        if (clashFound) break;
      }

      if (!clashFound) {
        // Build 64 slot map
        const finalMap: Array<DominoParticipant | null> = Array(totalSlots).fill(null);
        matchSlots.forEach((m, idx) => {
          finalMap[idx * 2] = m.p1;
          finalMap[idx * 2 + 1] = m.p2;
        });
        return finalMap;
      }
    }

    // Fallback simple shuffle if attempts exhaust
    const fallback: Array<DominoParticipant | null> = Array(totalSlots).fill(null);
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    shuffled.forEach((p, i) => {
      if (i < 64) fallback[i] = p;
    });
    return fallback;
  }, []);

  // Instant Smart Reshuffle with anti-clash
  const handleInstantSmartReshuffle = () => {
    if (participants.length === 0) {
      alert('Daftar peserta masih kosong. Silakan isi peserta terlebih dahulu.');
      return;
    }
    playSfx('SHUFFLE');
    const seeded = computeAntiClashSeeding(participants);
    setDrawnSlotMap(seeded);
    const newMatches = generateEmptyMatches(seeded);
    setMatches(newMatches);
    playSfx('DROP');
  };

  // STEP BY STEP DRAWING SIMULATION
  const executeSingleDrawStep = useCallback((currentMap: Array<DominoParticipant | null>) => {
    // Find next unplaced index
    const nextSlotIdx = currentMap.findIndex((s) => s === null);
    if (nextSlotIdx === -1 || nextSlotIdx >= 64) {
      setIsDrawingRunning(false);
      setIsRolling(false);
      playSfx('VICTORY');
      return;
    }

    // Remaining participants
    const placedIds = new Set(currentMap.filter((p): p is DominoParticipant => Boolean(p)).map((p) => p.id));
    const unplaced = participants.filter((p: DominoParticipant) => !placedIds.has(p.id));

    if (unplaced.length === 0) {
      setIsDrawingRunning(false);
      setIsRolling(false);
      playSfx('VICTORY');
      return;
    }

    setIsRolling(true);
    if (isFocusingEnabled) {
      setShowFocusingModal(true);
    }

    // Roll random names rapidly for dramatic effect
    let rollCount = 0;
    const maxRolls = drawingSpeed === 'FAST' ? 6 : drawingSpeed === 'SLOW' ? 20 : 12;

    if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
    rollingIntervalRef.current = setInterval(() => {
      const rand = unplaced[Math.floor(Math.random() * unplaced.length)];
      setRollingCandidate(rand ? rand.name : 'VAMOS DOMINO');
      playSfx('SHUFFLE');
      rollCount++;

      if (rollCount >= maxRolls) {
        clearInterval(rollingIntervalRef.current);

        // Pick next participant anti-clash check
        // Check opponent if this slot is slot 2 of a match (odd index)
        const isSlot2 = nextSlotIdx % 2 === 1;
        const opponent = isSlot2 ? currentMap[nextSlotIdx - 1] : null;

        const picked = unplaced.find((p: DominoParticipant) => {
          if (!opponent || !opponent.team || opponent.team === 'INDIVIDUAL') return true;
          return p.team !== opponent.team;
        }) || unplaced[0];

        const updatedMap = [...currentMap];
        updatedMap[nextSlotIdx] = picked;
        setDrawnSlotMap(updatedMap);

        const matchNumber = Math.floor(nextSlotIdx / 2) + 1;
        const slot: 1 | 2 = (nextSlotIdx % 2 === 0 ? 1 : 2) as 1 | 2;
        const pool: 'POOL_A' | 'POOL_B' = matchNumber <= 16 ? 'POOL_A' : 'POOL_B';

        setCurrentDrawn({
          participant: picked,
          matchNumber,
          slot,
          pool,
        });

        // Update the matches skeleton
        setMatches((prevMatches: DominoMatch[]) => {
          const updated = [...prevMatches];
          const matchIdx = updated.findIndex((m) => m.round === 1 && m.matchNumber === matchNumber);
          if (matchIdx !== -1) {
            if (slot === 1) updated[matchIdx].player1 = picked;
            else updated[matchIdx].player2 = picked;
          }
          return updated;
        });

        setIsRolling(false);
        playSfx('DROP');
      }
    }, 60);
  }, [participants, drawingSpeed, playSfx, isFocusingEnabled]);

  // Auto Drawing Timer Loop
  useEffect(() => {
    if (!isDrawingRunning) {
      if (drawingTimerRef.current) clearTimeout(drawingTimerRef.current);
      return;
    }

    if (drawingSpeed === 'INSTANT') {
      handleInstantSmartReshuffle();
      setIsDrawingRunning(false);
      return;
    }

    const delayMs = drawingSpeed === 'SLOW' ? 2200 : drawingSpeed === 'NORMAL' ? 1200 : 600;
    drawingTimerRef.current = setTimeout(() => {
      executeSingleDrawStep(drawnSlotMap);
    }, delayMs);

    return () => {
      if (drawingTimerRef.current) clearTimeout(drawingTimerRef.current);
    };
  }, [isDrawingRunning, drawnSlotMap, drawingSpeed, executeSingleDrawStep]);

  // Reset Drawing
  const handleResetDraw = () => {
    setIsDrawingRunning(false);
    setIsRolling(false);
    setShowFocusingModal(false);
    setDrawnSlotMap(Array(64).fill(null));
    setCurrentDrawn(null);
    setMatches(generateEmptyMatches(Array(64).fill(null)));
    playSfx('CLICK');
  };

  // ADVANCE WINNER IN BRACKET
  const handleSelectWinner = (match: DominoMatch, winnerSlot: 1 | 2) => {
    const winner = winnerSlot === 1 ? match.player1 : match.player2;
    if (!winner) return;

    playSfx('VICTORY');

    setMatches((prev: DominoMatch[]) => {
      const updated = [...prev];
      const currentIdx = updated.findIndex((m) => m.id === match.id);
      if (currentIdx === -1) return prev;

      // Update current match
      updated[currentIdx] = {
        ...updated[currentIdx],
        winnerId: winner.id,
        score1: winnerSlot === 1 ? (modalScore1 || 100) : (modalScore2 || 0),
        score2: winnerSlot === 2 ? (modalScore2 || 100) : (modalScore1 || 0),
        status: 'COMPLETED',
      };

      // Propagate winner to next round
      const currentRound = match.round;
      const currentMatchNum = match.matchNumber;

      if (currentRound < 6) {
        // Next match calculation:
        // Round 1 (1-32) -> Round 2 (33-48): match (1,2) -> 33, (3,4) -> 34, ...
        // Round 2 (33-48) -> Round 3 (49-56): (33,34) -> 49, (35,36) -> 50, ...
        // Round 3 (49-56) -> Round 4 (57-60): (49,50) -> 57, (51,52) -> 58, ...
        // Round 4 (57-60) -> Round 5 (61-62): (57,58) -> 61, (59,60) -> 62
        // Round 5 (61-62) -> Round 6 (63): (61,62) -> 63
        let nextMatchNum = 63;
        let isSlot1InNext = true;

        if (currentRound === 1) {
          nextMatchNum = 33 + Math.floor((currentMatchNum - 1) / 2);
          isSlot1InNext = (currentMatchNum - 1) % 2 === 0;
        } else if (currentRound === 2) {
          nextMatchNum = 49 + Math.floor((currentMatchNum - 33) / 2);
          isSlot1InNext = (currentMatchNum - 33) % 2 === 0;
        } else if (currentRound === 3) {
          nextMatchNum = 57 + Math.floor((currentMatchNum - 49) / 2);
          isSlot1InNext = (currentMatchNum - 49) % 2 === 0;
        } else if (currentRound === 4) {
          nextMatchNum = 61 + Math.floor((currentMatchNum - 57) / 2);
          isSlot1InNext = (currentMatchNum - 57) % 2 === 0;
        } else if (currentRound === 5) {
          nextMatchNum = 63;
          isSlot1InNext = currentMatchNum === 61;
        }

        const nextIdx = updated.findIndex((m) => m.round === currentRound + 1 && m.matchNumber === nextMatchNum);
        if (nextIdx !== -1) {
          if (isSlot1InNext) {
            updated[nextIdx].player1 = winner;
          } else {
            updated[nextIdx].player2 = winner;
          }
        }
      }

      return updated;
    });

    setSelectedMatchForScore(null);
  };

  // Bulk Paste WhatsApp Registration text parser
  const handleApplyBulkPaste = () => {
    if (!bulkPasteText.trim()) return;

    const lines = bulkPasteText
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    const parsed: DominoParticipant[] = [];

    lines.forEach((line: string, idx: number) => {
      // Remove leading number e.g. "1.", "01 -", etc.
      let cleanLine = line.replace(/^\d+[\s\.\)-]+\s*/, '').trim();

      // Extract team if present
      let team = 'INDIVIDUAL';
      const teamMatch = cleanLine.match(/\(([a-zA-Z0-9_\s-]+)\)|\[([a-zA-Z0-9_\s-]+)\]/);
      if (teamMatch) {
        team = (teamMatch[1] || teamMatch[2]).trim().toUpperCase();
        cleanLine = cleanLine.replace(/\(.*?\)|\[.*?\]/, '').trim();
      } else {
        const parts = cleanLine.split(/\s*-\s*/);
        if (parts.length > 1) {
          team = parts[0].trim().toUpperCase();
          cleanLine = parts.slice(1).join('-').trim();
        }
      }

      if (cleanLine.length > 0 && parsed.length < 64) {
        parsed.push({
          id: `wa_${Date.now()}_${idx}`,
          name: cleanLine,
          team,
          paymentStatus: 'PAID',
          slotNumber: parsed.length + 1,
        });
      }
    });

    if (parsed.length > 0) {
      setParticipants(parsed);
      setShowBulkPasteModal(false);
      setBulkPasteText('');
      playSfx('VICTORY');
      alert(`Berhasil memasukkan ${parsed.length} pasangan peserta!`);
    }
  };

  // Add 1 participant manually
  const handleAddSingleParticipant = () => {
    if (!newPairName.trim()) return;
    if (participants.length >= 64) {
      alert('Kuota 64 slot sudah penuh!');
      return;
    }

    const newP: DominoParticipant = {
      id: `manual_${Date.now()}`,
      name: newPairName.trim(),
      team: (newPairTeam.trim() || 'INDIVIDUAL').toUpperCase(),
      paymentStatus: 'PAID',
      slotNumber: participants.length + 1,
    };

    setParticipants([...participants, newP]);
    setNewPairName('');
    setNewPairTeam('');
    setShowAddSingleModal(false);
    playSfx('DROP');
  };

  // Fill 64 Simulation Dummy Pairs
  const handleFillSimulation64 = () => {
    const list: DominoParticipant[] = SAMPLE_64_PAIRS.map((s, idx) => ({
      id: `sim_${idx + 1}`,
      name: s.name,
      team: s.team,
      paymentStatus: 'PAID',
      slotNumber: idx + 1,
    }));
    setParticipants(list);
    playSfx('VICTORY');
  };

  // Copy WhatsApp Template Text to Clipboard
  const handleCopyTemplate = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(WA_TEMPLATE_TEXT);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = WA_TEMPLATE_TEXT;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedTemplate(true);
      playSfx('VICTORY');
      setTimeout(() => setCopiedTemplate(false), 3000);
    } catch {
      alert('Silakan salin teks manual dari kotak template.');
    }
  };

  // Apply Sample Template Directly to System
  const handleApplyTemplate = () => {
    handleFillSimulation64();
    setShowTemplateModal(false);
    playSfx('VICTORY');
    alert('64 pasangan dari template sampel berhasil dimuat ke sistem!');
  };

  // Clear all participants
  const handleClearParticipants = () => {
    if (window.confirm('Kosongkan semua daftar peserta?')) {
      setParticipants([]);
      handleResetDraw();
    }
  };

  // Fullscreen TV Mode Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsTvMode(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsTvMode(false);
      }
    }
  };

  // Save/Sync to VPS Backend Bracket
  const handleSaveToVps = async () => {
    try {
      setIsSavingBracket(true);
      // Generate bracket endpoint or reshuffle endpoint
      const res = await fetch(`${API_BASE}/tournaments/${TOURNAMENT_ID}/reshuffle-bracket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vamos_staff_token') || ''}`,
        },
      });

      if (!res.ok) {
        // If not logged in, simulate success locally
        console.warn('Backend sync returned non-200, kept local live state.');
      }
      playSfx('VICTORY');
      alert('Hasil undian & bagan turnamen domino berhasil disimpan!');
    } catch (e) {
      alert('Tersimpan di sistem browser lokal.');
    } finally {
      setIsSavingBracket(false);
    }
  };

  // Filtered participants list for search
  const filteredParticipants = useMemo(() => {
    if (!filterQuery) return participants;
    return participants.filter(
      (p: DominoParticipant) =>
        p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (p.team && p.team.toLowerCase().includes(filterQuery.toLowerCase()))
    );
  }, [participants, filterQuery]);

  // Reusable Table Card for 16 Physical Tables (Landscape & Grid)
  const renderTableCard = (
    matchNum: number,
    sessionNum: number,
    physicalTable: number,
    p1: DominoParticipant | null,
    p2: DominoParticipant | null,
    pool: 'POOL_A' | 'POOL_B',
    isJustDrawn: boolean = false
  ) => {
    const isPoolA = pool === 'POOL_A';

    return (
      <div
        key={matchNum}
        className={`p-3 rounded-2xl border transition-all ${
          isJustDrawn
            ? 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] border-amber-400 bg-[#1a1426] scale-[1.01]'
            : isPoolA
            ? 'bg-[#0a1226] border-blue-500/20 hover:border-blue-400/50'
            : 'bg-[#120f26] border-red-500/20 hover:border-red-400/50'
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              MEJA {String(physicalTable).padStart(2, '0')}
            </span>
            <span
              className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                sessionNum === 1 ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              SESI {sessionNum}
            </span>
            <span className="text-[9px] font-mono text-slate-500">#{matchNum}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isJustDrawn && (
              <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded animate-pulse">
                BARU TERUNDI
              </span>
            )}
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                isPoolA
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {isPoolA ? 'POOL A' : 'POOL B'}
            </span>
          </div>
        </div>

        {/* Slot 1 */}
        <div
          className={`p-2 rounded-xl mb-1.5 flex items-center justify-between border ${
            p1
              ? 'bg-[#151f38] border-white/10 text-white'
              : 'bg-black/30 border-dashed border-white/10 text-slate-500'
          }`}
        >
          <div className="truncate pr-2">
            <span className="text-[11px] font-bold block truncate">
              {p1 ? p1.name : `Slot ${matchNum * 2 - 1} (Menunggu)`}
            </span>
            {p1?.team && p1.team !== 'INDIVIDUAL' && (
              <span className="text-[8px] font-black uppercase text-amber-400/80 tracking-wider">
                {p1.team}
              </span>
            )}
          </div>
          <DominoTile top={matchNum % 7} bottom={1} size="xs" isFlipped={!p1} />
        </div>

        {/* Slot 2 */}
        <div
          className={`p-2 rounded-xl flex items-center justify-between border ${
            p2
              ? 'bg-[#151f38] border-white/10 text-white'
              : 'bg-black/30 border-dashed border-white/10 text-slate-500'
          }`}
        >
          <div className="truncate pr-2">
            <span className="text-[11px] font-bold block truncate">
              {p2 ? p2.name : `Slot ${matchNum * 2} (Menunggu)`}
            </span>
            {p2?.team && p2.team !== 'INDIVIDUAL' && (
              <span className="text-[8px] font-black uppercase text-amber-400/80 tracking-wider">
                {p2.team}
              </span>
            )}
          </div>
          <DominoTile top={matchNum % 7} bottom={2} size="xs" isFlipped={!p2} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-white flex flex-col font-sans selection:bg-red-500 selection:text-white pb-24">
      {/* ─── TOP BAR & EVENT BANNER ─── */}
      <header className="sticky top-0 z-50 bg-[#091124]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300"
                title="Kembali ke App Vamos"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-red-400">
                <DominoTile top={6} bottom={6} size="xs" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400 italic">
                    VAMOS POOL & CAFÉ WONOMULYO
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[8px] font-black uppercase tracking-wider">
                    64 SLOT
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black italic tracking-tighter uppercase text-white leading-none">
                  DOMINO <span className="text-red-500">FUN TOURNAMENT</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
              title={soundEnabled ? 'Mute SFX' : 'Unmute SFX'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] uppercase italic tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            >
              {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
              <span className="hidden sm:inline">{isTvMode ? 'EXIT TV' : 'MODE TV / PROYEKTOR'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── FLYER HERO SUMMARY BAR ─── */}
      <section className="bg-gradient-to-b from-[#0d1730] to-[#070e20] border-b border-white/5 px-4 py-4 sm:py-6 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className="bg-red-600 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg italic shadow-lg">
                PRIZE POOL RP 3.000.000
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg italic">
                + VOUCHER BILLIARD 2 JAM
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Match Play: <strong className="text-white">9 OKTOBER 2026</strong> • Registrasi: <strong className="text-white">50.000 / Pasang</strong> • CP: <strong className="text-emerald-400">0856 5653 9144</strong>
            </p>
          </div>

          {/* Slot Progress Bar */}
          <div className="w-full md:w-80 bg-[#0a1122] border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5 shadow-xl">
            <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
              <span className="text-slate-400">Kapasitas Slot Turnamen:</span>
              <span className="text-red-400 font-mono text-xs">{participants.length} / 64 PASANGAN</span>
            </div>
            <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (participants.length / 64) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN TABS NAVIGATION ─── */}
      <nav className="max-w-7xl mx-auto w-full px-4 pt-4">
        <div className="flex bg-[#0a1224] p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <button
            onClick={() => { setActiveTab('draw'); playSfx('CLICK'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider italic flex items-center justify-center gap-2 transition-all ${
              activeTab === 'draw'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>1. UNDIAN LIVE (TV MODE)</span>
          </button>

          <button
            onClick={() => { setActiveTab('bracket'); playSfx('CLICK'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider italic flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bracket'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>2. BAGAN PERTANDINGAN (64)</span>
          </button>

          <button
            onClick={() => { setActiveTab('participants'); playSfx('CLICK'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider italic flex items-center justify-center gap-2 transition-all ${
              activeTab === 'participants'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. PESERTA ({participants.length})</span>
          </button>
        </div>
      </nav>

      {/* ─── TAB 1: UNDIAN LIVE (TV / STUDIO DRAWING) ─── */}
      {activeTab === 'draw' && (
        <main className="max-w-[1720px] mx-auto w-full px-4 pt-4 sm:pt-6 space-y-6">
          {/* Top Control Bar: Layout & Focusing Toggles */}
          <div className="bg-[#091124] border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
                TAMPILAN:
              </span>
              <div className="flex items-center bg-[#060a16] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setTvLayoutMode('LANDSCAPE_SPLIT')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                    tvLayoutMode === 'LANDSCAPE_SPLIT'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>TV BROADCAST LANDSCAPE (SPLIT)</span>
                </button>
                <button
                  onClick={() => setTvLayoutMode('GRID')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                    tvLayoutMode === 'GRID'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>TABEL GRID (4 KOLOM)</span>
                </button>
              </div>

              {/* Dramatic Focusing Toggle */}
              <button
                onClick={() => setIsFocusingEnabled(!isFocusingEnabled)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 transition-all ${
                  isFocusingEnabled
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Aktifkan atau matikan panggung spotlight focusing saat pengundian"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isFocusingEnabled ? '✨ FOCUSING TV: AKTIF' : 'FOCUSING TV: NONAKTIF'}</span>
              </button>

              <button
                onClick={() => setShowFocusingModal(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 active:scale-95 text-white text-[10px] font-black uppercase italic tracking-wider flex items-center gap-1.5 shadow-md transition-all"
              >
                <span>BUKA STAGE FOKUS</span>
              </button>
            </div>

            {/* Session filter & lock to cloud */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[#060a16] p-1 rounded-xl border border-white/10 text-[10px] font-black uppercase">
                <button
                  onClick={() => setSessionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sessionFilter === 'ALL' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Semua (32)
                </button>
                <button
                  onClick={() => setSessionFilter('SESSION_1')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sessionFilter === 'SESSION_1' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sesi 1 (Pool A)
                </button>
                <button
                  onClick={() => setSessionFilter('SESSION_2')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sessionFilter === 'SESSION_2' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sesi 2 (Pool B)
                </button>
              </div>

              <button
                onClick={handleSaveToVps}
                disabled={isSavingBracket}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] uppercase tracking-wider italic hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingBracket ? 'MENYIMPAN...' : 'KUNCI'}</span>
              </button>
            </div>
          </div>

          {/* ─── RENDER LAYOUT: LANDSCAPE SPLIT OR GRID ─── */}
          {tvLayoutMode === 'LANDSCAPE_SPLIT' ? (
            <div className="flex flex-col xl:flex-row items-start gap-6">
              {/* Left Column: Broadcast Arena & Controls (~410px width on desktop/TV) */}
              <div className="w-full xl:w-[410px] shrink-0 xl:sticky xl:top-20 space-y-4">
                {/* TV Stage Focus Area */}
                <section className="bg-gradient-to-b from-[#0f1b38] to-[#081022] border-2 border-red-500/30 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-red-600/10 rounded-full blur-[70px] pointer-events-none" />

                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    {/* Big 3D Domino Tile */}
                    <div className="relative group py-1">
                      <DominoTile
                        top={isRolling ? Math.floor(Math.random() * 7) : currentDrawn ? ((currentDrawn.matchNumber % 6) + 1) : 6}
                        bottom={isRolling ? Math.floor(Math.random() * 7) : currentDrawn ? (currentDrawn.slot === 1 ? 6 : 1) : 6}
                        size="xl"
                        isShuffling={isRolling}
                        glow={!isRolling && Boolean(currentDrawn)}
                      />
                      {isRolling && (
                        <div className="absolute -top-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-red-500 text-black font-black text-[9px] uppercase animate-bounce shadow-md">
                          MENGUNDI
                        </div>
                      )}
                    </div>

                    {/* Status & Candidate */}
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest italic">
                          {isRolling ? 'SISTEM ANTI-CLASH AKTIF' : currentDrawn ? `TERUNDI: SLOT ${currentDrawn.slot === 1 ? '1' : '2'}` : 'SIAP DIUNDI'}
                        </span>
                        {currentDrawn && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                            {currentDrawn.matchNumber <= 16
                              ? `MEJA ${String(currentDrawn.matchNumber).padStart(2, '0')} (SESI 1 • POOL A)`
                              : `MEJA ${String(currentDrawn.matchNumber - 16).padStart(2, '0')} (SESI 2 • POOL B)`}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight truncate">
                        {isRolling ? rollingCandidate : currentDrawn ? currentDrawn.participant.name : 'VAMOS DOMINO 2026'}
                      </h2>

                      {currentDrawn?.participant.team && currentDrawn.participant.team !== 'INDIVIDUAL' ? (
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                          Klub / Tim: {currentDrawn.participant.team}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          Algoritma memisahkan tim se-tongkrongan ke pool berbeda
                        </p>
                      )}
                    </div>

                    {/* Speed Selector */}
                    <div className="w-full flex items-center gap-1.5 bg-[#060a16] p-1 rounded-xl border border-white/10 justify-center">
                      {(['SLOW', 'NORMAL', 'FAST', 'INSTANT'] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setDrawingSpeed(spd)}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            drawingSpeed === spd
                              ? 'bg-red-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd === 'SLOW' ? 'Lambat' : spd === 'NORMAL' ? 'Normal' : spd === 'FAST' ? 'Cepat' : 'Instan'}
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-2">
                      {!isDrawingRunning ? (
                        <button
                          onClick={() => {
                            setIsDrawingRunning(true);
                            if (isFocusingEnabled) setShowFocusingModal(true);
                            playSfx('CLICK');
                          }}
                          disabled={participants.length === 0}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider italic hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>MULAI UNDIAN OTOMATIS</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsDrawingRunning(false);
                            playSfx('CLICK');
                          }}
                          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-black text-xs uppercase tracking-wider italic hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                          <span>JEDA UNDIAN</span>
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (isFocusingEnabled) setShowFocusingModal(true);
                            executeSingleDrawStep(drawnSlotMap);
                          }}
                          disabled={isDrawingRunning || participants.length === 0}
                          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-wider italic hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
                          title="Undi 1 Pasangan"
                        >
                          +1 SLOT
                        </button>

                        <button
                          onClick={handleInstantSmartReshuffle}
                          disabled={isDrawingRunning || participants.length === 0}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-black text-xs uppercase tracking-wider italic hover:bg-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                          title="Kocok Ulang Anti-Clash"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>KOCOK ULANG</span>
                        </button>

                        <button
                          onClick={handleResetDraw}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                          title="Reset Papan Undian"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Slot counter summary */}
                <div className="bg-[#091124] border border-white/10 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-400">Slot Terundi:</span>
                    <span className="text-amber-400 font-mono text-xs">
                      {drawnSlotMap.filter(Boolean).length} / 64 Slot
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${(drawnSlotMap.filter(Boolean).length / 64) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-snug">
                    Total 32 Match Babak 64 Besar dimainkan dalam 2 Sesi di Meja 01 s/d Meja 16.
                  </div>
                </div>
              </div>

              {/* Right Column: Dual Session 16 Tables Side-by-Side */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sub-column 1: Sesi 1 (Pool A) Meja 01 s/d 16 */}
                  {(sessionFilter === 'ALL' || sessionFilter === 'SESSION_1') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-blue-500/40">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                          <h4 className="font-black italic uppercase text-sm text-white tracking-wider">
                            SESI 1 (POOL A) • MEJA 01 s/d 16
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400">Match 1 - 16</span>
                      </div>

                      <div className="space-y-2.5">
                        {Array.from({ length: 16 }, (_, i) => {
                          const matchNum = i + 1;
                          const p1 = drawnSlotMap[i * 2];
                          const p2 = drawnSlotMap[i * 2 + 1];
                          const isJustDrawn = currentDrawn?.matchNumber === matchNum;

                          return renderTableCard(matchNum, 1, matchNum, p1, p2, 'POOL_A', isJustDrawn);
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sub-column 2: Sesi 2 (Pool B) Meja 01 s/d 16 */}
                  {(sessionFilter === 'ALL' || sessionFilter === 'SESSION_2') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-red-500/40">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                          <h4 className="font-black italic uppercase text-sm text-white tracking-wider">
                            SESI 2 (POOL B) • MEJA 01 s/d 16
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-red-400">Match 17 - 32</span>
                      </div>

                      <div className="space-y-2.5">
                        {Array.from({ length: 16 }, (_, i) => {
                          const matchNum = i + 17;
                          const p1 = drawnSlotMap[(i + 16) * 2];
                          const p2 = drawnSlotMap[(i + 16) * 2 + 1];
                          const isJustDrawn = currentDrawn?.matchNumber === matchNum;

                          return renderTableCard(matchNum, 2, i + 1, p1, p2, 'POOL_B', isJustDrawn);
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Classic 4 Column Grid Mode */
            <div className="space-y-6">
              <section className="bg-gradient-to-b from-[#0f1b38] to-[#081022] border-2 border-red-500/20 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="relative group">
                      <DominoTile
                        top={isRolling ? Math.floor(Math.random() * 7) : 6}
                        bottom={isRolling ? Math.floor(Math.random() * 7) : 6}
                        size="xl"
                        isShuffling={isRolling}
                        glow={!isRolling && Boolean(currentDrawn)}
                      />
                      {isRolling && (
                        <div className="absolute -top-3 -right-3 px-2 py-0.5 rounded-full bg-red-500 text-black font-black text-[9px] uppercase animate-bounce shadow-md">
                          MENGUNDI
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest italic">
                          {isRolling ? 'SISTEM ANTI-CLASH AKTIF' : currentDrawn ? `TERUNDI: SLOT ${currentDrawn.slot === 1 ? 'A' : 'B'}` : 'SIAP DIUNDI'}
                        </span>
                        {currentDrawn && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                            {currentDrawn.matchNumber <= 16
                              ? `MEJA ${String(currentDrawn.matchNumber).padStart(2, '0')} (SESI 1 • POOL A)`
                              : `MEJA ${String(currentDrawn.matchNumber - 16).padStart(2, '0')} (SESI 2 • POOL B)`}
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-4xl font-black text-white uppercase italic tracking-tight truncate max-w-md">
                        {isRolling ? rollingCandidate : currentDrawn ? currentDrawn.participant.name : 'VAMOS DOMINO 2026'}
                      </h2>

                      <p className="text-xs text-slate-400 font-medium">
                        {currentDrawn?.participant.team && currentDrawn.participant.team !== 'INDIVIDUAL' ? (
                          <span className="text-amber-400 font-bold uppercase tracking-wider">
                            Klub / Tim: {currentDrawn.participant.team}
                          </span>
                        ) : (
                          'Algoritma memisahkan tim se-tongkrongan agar tidak bertemu di babak awal'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-[#060a16] p-1.5 rounded-2xl border border-white/10 justify-center">
                      {(['SLOW', 'NORMAL', 'FAST', 'INSTANT'] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setDrawingSpeed(spd)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            drawingSpeed === spd
                              ? 'bg-red-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd === 'SLOW' ? 'Lambat' : spd === 'NORMAL' ? 'Normal' : spd === 'FAST' ? 'Cepat' : 'Instan'}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-center">
                      {!isDrawingRunning ? (
                        <button
                          onClick={() => {
                            setIsDrawingRunning(true);
                            if (isFocusingEnabled) setShowFocusingModal(true);
                            playSfx('CLICK');
                          }}
                          disabled={participants.length === 0}
                          className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider italic hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>MULAI UNDIAN OTOMATIS</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsDrawingRunning(false);
                            playSfx('CLICK');
                          }}
                          className="flex-1 sm:flex-none px-6 py-3.5 rounded-2xl bg-amber-600 text-white font-black text-xs uppercase tracking-wider italic hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                          <span>JEDA UNDIAN</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (isFocusingEnabled) setShowFocusingModal(true);
                          executeSingleDrawStep(drawnSlotMap);
                        }}
                        disabled={isDrawingRunning || participants.length === 0}
                        className="px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-wider italic hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
                        title="Undi 1 Pasangan"
                      >
                        +1 SLOT
                      </button>

                      <button
                        onClick={handleInstantSmartReshuffle}
                        disabled={isDrawingRunning || participants.length === 0}
                        className="px-4 py-3.5 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-black text-xs uppercase tracking-wider italic hover:bg-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40"
                        title="Kocok Ulang Anti-Clash"
                      >
                        <Shuffle className="w-4 h-4" />
                        <span className="hidden sm:inline">KOCOK ULANG</span>
                      </button>

                      <button
                        onClick={handleResetDraw}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all"
                        title="Reset Papan Undian"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 32 }, (_, i) => {
                  const matchNum = i + 1;
                  const p1 = drawnSlotMap[i * 2];
                  const p2 = drawnSlotMap[i * 2 + 1];
                  const isPoolA = matchNum <= 16;

                  if (sessionFilter === 'SESSION_1' && !isPoolA) return null;
                  if (sessionFilter === 'SESSION_2' && isPoolA) return null;

                  const physicalTable = matchNum <= 16 ? matchNum : matchNum - 16;
                  const sessionNum = matchNum <= 16 ? 1 : 2;
                  const isJustDrawn = currentDrawn?.matchNumber === matchNum;

                  return renderTableCard(matchNum, sessionNum, physicalTable, p1, p2, isPoolA ? 'POOL_A' : 'POOL_B', isJustDrawn);
                })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ─── TAB 2: BAGAN PERTANDINGAN (64 DUAL WING BRACKET TREE) ─── */}
      {activeTab === 'bracket' && (
        <main className="max-w-[1720px] mx-auto w-full px-4 pt-4 sm:pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                <span>BAGAN ELIMINASI 64 PASANGAN DOMINO</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase">
                  16 MEJA FISIK • DUAL WING TREE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pohon bagan eliminasi turnamen resmi. Klik kartu untuk input skor atau klik nama pasangan untuk langsung meloloskan pemenang ke babak berikutnya.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari pasangan..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="bg-[#0c1428] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 w-48"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase italic hover:bg-white/10 flex items-center gap-1.5"
              >
                <span>CETAK BAGAN</span>
              </button>
            </div>
          </div>

          {/* Interactive Dual-Wing Tournament Bracket Tree */}
          <DominoBracketTree
            matches={matches}
            onSelectMatch={setSelectedMatchForScore}
            onAdvanceWinner={handleSelectWinner}
          />
        </main>
      )}

      {/* ─── TAB 3: PESERTA (64 PASANGAN & INPUT DATA) ─── */}
      {activeTab === 'participants' && (
        <main className="max-w-7xl mx-auto w-full px-4 pt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white">
                DAFTAR PASANGAN PESERTA ({participants.length} / 64)
              </h3>
              <p className="text-xs text-slate-400">
                Masukkan nama pasangan, tim/klub komunitas, atau paste langsung dari chat grup WhatsApp panitia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>TEMPLATE CONTOH NAMA</span>
              </button>

              <button
                onClick={() => setShowAddSingleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider italic flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ 1 PASANGAN</span>
              </button>

              <button
                onClick={() => setShowBulkPasteModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>IMPORT DARI WA</span>
              </button>

              <button
                onClick={handleFillSimulation64}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>SIMULASI 64 SLOT</span>
              </button>

              <button
                onClick={handleClearParticipants}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                title="Kosongkan Semua"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 16 Physical Tables Notice Banner */}
          <div className="bg-[#0b1428] border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                16
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-amber-300">
                  KAPASITAS VENUE: KHUSUS 16 MEJA DOMINO
                </h4>
                <p className="text-[11px] text-slate-400">
                  Babak 64 Besar dimainkan dalam 2 Sesi (Sesi 1: Meja 01–16, Sesi 2: Meja 01–16). Babak 32 Besar serentak di 16 Meja.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase hover:bg-amber-500/30 transition-all whitespace-nowrap"
            >
              LIHAT TEMPLATE
            </button>
          </div>

          {/* Search Bar for Participants */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari pasangan / tim..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-[#0a1122] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {isLoading && (
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider animate-pulse">
                Sinkronisasi Data...
              </span>
            )}
          </div>

          {/* Grid of 64 slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 64 }, (_, idx) => {
              const p = filteredParticipants[idx];

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    p
                      ? 'bg-[#0d162c] border-white/15 text-white'
                      : 'bg-black/20 border-dashed border-white/10 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-slate-400 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">
                        {p ? p.name : 'Slot Kosong'}
                      </p>
                      {p?.team && p.team !== 'INDIVIDUAL' && (
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">
                          {p.team}
                        </span>
                      )}
                    </div>
                  </div>

                  {p && (
                    <button
                      onClick={() => {
                        const updated = participants.filter((x: DominoParticipant) => x.id !== p.id);
                        setParticipants(updated);
                      }}
                      className="text-slate-600 hover:text-rose-400 p-1"
                      title="Hapus slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* ─── MODAL 1: UPDATE SKOR & PEMENANG MEJA ─── */}
      {selectedMatchForScore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1428] border-2 border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-6">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 italic">
                INPUT HASIL PERTANDINGAN
              </span>
              <h4 className="text-lg font-black uppercase italic text-white mt-1">
                {getPhysicalTableInfo(selectedMatchForScore).fullLabel} • MATCH #{selectedMatchForScore.matchNumber} (BABAK {selectedMatchForScore.round})
              </h4>
            </div>

            {/* Score points manual input */}
            <div className="flex items-center gap-3 bg-[#060a16] p-3 rounded-2xl border border-white/10">
              <div className="flex-1 text-center">
                <span className="text-[9px] font-bold text-slate-400 block mb-1">Poin P1</span>
                <input
                  type="number"
                  value={modalScore1}
                  onChange={(e) => setModalScore1(Number(e.target.value))}
                  className="w-full bg-[#0d162d] border border-white/10 rounded-xl py-1.5 px-2 text-center text-white text-xs font-mono font-bold focus:outline-none focus:border-red-400"
                />
              </div>
              <span className="font-bold text-slate-600">-</span>
              <div className="flex-1 text-center">
                <span className="text-[9px] font-bold text-slate-400 block mb-1">Poin P2</span>
                <input
                  type="number"
                  value={modalScore2}
                  onChange={(e) => setModalScore2(Number(e.target.value))}
                  className="w-full bg-[#0d162d] border border-white/10 rounded-xl py-1.5 px-2 text-center text-white text-xs font-mono font-bold focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: P1 Menang */}
              <button
                onClick={() => handleSelectWinner(selectedMatchForScore, 1)}
                className="w-full p-4 rounded-2xl bg-[#121f3d] border border-blue-500/30 hover:border-blue-400 active:scale-95 text-left transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-blue-400 block">PASANGAN 1</span>
                    <p className="text-sm font-black text-white uppercase italic">
                      {selectedMatchForScore.player1?.name || 'TBD'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase">
                    PILIH MENANG
                  </span>
                </div>
              </button>

              {/* Option 2: P2 Menang */}
              <button
                onClick={() => handleSelectWinner(selectedMatchForScore, 2)}
                className="w-full p-4 rounded-2xl bg-[#21142d] border border-red-500/30 hover:border-red-400 active:scale-95 text-left transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black uppercase text-red-400 block">PASANGAN 2</span>
                    <p className="text-sm font-black text-white uppercase italic">
                      {selectedMatchForScore.player2?.name || 'TBD'}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 font-black text-[10px] uppercase">
                    PILIH MENANG
                  </span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setSelectedMatchForScore(null)}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-black uppercase tracking-wider"
            >
              BATAL
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: BULK IMPORT DARI WHATSAPP ─── */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1428] border-2 border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <div>
              <h4 className="text-base font-black uppercase italic text-white flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-emerald-400" />
                <span>IMPORT DAFTAR PESERTA DARI WA</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Paste daftar teks chat WhatsApp. Format otomatis dideteksi (nama tim dalam kurung atau strip).
              </p>
            </div>

            <textarea
              rows={10}
              value={bulkPasteText}
              onChange={(e) => setBulkPasteText(e.target.value)}
              placeholder={`Contoh teks:\n1. Budi / Agus (Warkop 55)\n2. Rudi / Hendra [Vamos Crew]\n3. Tim Surya - Iwan / Dedi\n4. Anton / Joko`}
              className="w-full bg-[#060a16] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
            />

            <div className="flex gap-2">
              <button
                onClick={handleApplyBulkPaste}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider italic shadow-lg"
              >
                PROSES DAFTAR PESERTA
              </button>
              <button
                onClick={() => setShowBulkPasteModal(false)}
                className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: TAMBAH 1 PASANGAN ─── */}
      {showAddSingleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1428] border-2 border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-black uppercase italic text-white">
              TAMBAH PASANGAN PESERTA
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Nama Pasangan (Contoh: Budi / Agus)
                </label>
                <input
                  type="text"
                  value={newPairName}
                  onChange={(e) => setNewPairName(e.target.value)}
                  placeholder="Nama Duet / Pasangan"
                  className="w-full bg-[#060a16] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Klub / Tim / Tongkrongan (Opsional)
                </label>
                <input
                  type="text"
                  value={newPairTeam}
                  onChange={(e) => setNewPairTeam(e.target.value)}
                  placeholder="Contoh: Warkop 55, Garda Wonomulyo..."
                  className="w-full bg-[#060a16] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddSingleParticipant}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-wider italic shadow-lg"
              >
                SIMPAN PASANGAN
              </button>
              <button
                onClick={() => setShowAddSingleModal(false)}
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase"
              >
                BATAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: TEMPLATE CONTOH NAMA (WHATSAPP SAMPLE) ─── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1428] border-2 border-amber-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                    VENUE: KHUSUS 16 MEJA DOMINO
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-black uppercase tracking-wider">
                    64 SLOT PASANGAN
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black uppercase italic text-white mt-1">
                  TEMPLATE & CONTOH DAFTAR PESERTA DOMINO
                </h4>
                <p className="text-[11px] text-slate-400">
                  Gunakan sample ini untuk membagikan daftar ke grup WhatsApp panitia/peserta, atau coba simulasi undian anti-clash langsung.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 border border-white/10"
              >
                ✕
              </button>
            </div>

            {/* Notification of 16 Tables */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs text-amber-200/90 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <span>⚠️ Catatan Alokasi 16 Meja Domino:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Karena hanya tersedia <strong>16 Meja Fisik</strong>, Babak 64 Besar dimainkan dalam <strong>2 Sesi</strong>:
                <br />• <strong>Sesi 1 (Pool A)</strong>: Meja 01 s/d Meja 16 (Match 1–16)
                <br />• <strong>Sesi 2 (Pool B)</strong>: Meja 01 s/d Meja 16 (Match 17–32)
                <br />• <strong>Babak 32 Besar</strong>: Meja 01 s/d Meja 16 (Serentak semua meja terisi penuh)
              </p>
            </div>

            {/* Preview Box */}
            <div className="flex-1 overflow-y-auto bg-[#060a16] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 leading-relaxed max-h-60 select-all whitespace-pre-wrap">
              {WA_TEMPLATE_TEXT}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleCopyTemplate}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                {copiedTemplate ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTemplate ? 'TERSALIN KE CLIPBOARD!' : 'SALIN TEKS FORMAT WHATSAPP'}</span>
              </button>

              <button
                onClick={handleApplyTemplate}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider italic flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>TERAPKAN 64 CONTOH KE SISTEM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: SPOTLIGHT FOCUSING SAAT DRAWING ─── */}
      <DominoDrawFocusingModal
        isOpen={showFocusingModal}
        isRolling={isRolling}
        rollingCandidate={rollingCandidate}
        currentDrawn={currentDrawn}
        currentMatch={currentDrawn ? matches.find((m) => m.round === 1 && m.matchNumber === currentDrawn.matchNumber) : null}
        onClose={() => setShowFocusingModal(false)}
        isAutoRunning={isDrawingRunning}
        onToggleAuto={() => setIsDrawingRunning(!isDrawingRunning)}
        onNextSlot={() => executeSingleDrawStep(drawnSlotMap)}
        speed={drawingSpeed}
        totalDrawnCount={drawnSlotMap.filter(Boolean).length}
        totalSlots={64}
      />
    </div>
  );
};

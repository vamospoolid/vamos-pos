import { useState } from 'react';
import { ArrowLeft, Target, BarChart3, History, Trophy, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAppStore } from '../store/appStore';

const DRILLS = [
  {
    id: 'D001',
    name: 'Straight In Shot',
    difficulty: 'Beginner',
    description: 'Latih akurasi tembakan lurus. Tempatkan bola objek 1 meter dari pocket dan bola putih 50cm di belakangnya.',
    target: 50,
    xpReward: 10
  },
  {
    id: 'D002',
    name: 'Stop Shot Master',
    difficulty: 'Intermediate',
    description: 'Pukul bola putih agar berhenti tepat di tempat bola objek setelah tabrakan.',
    target: 50,
    xpReward: 15
  },
  {
    id: 'D003',
    name: 'Angle & Cut Shot',
    difficulty: 'Intermediate',
    description: 'Latih tembakan sudut 30 dan 45 derajat.',
    target: 50,
    xpReward: 20
  },
  {
    id: 'D004',
    name: 'Draw Shot Protocol',
    difficulty: 'Advanced',
    description: 'Pukul bola putih dengan efek bawah agar kembali ke arah Anda minimal 50cm.',
    target: 50,
    xpReward: 25
  }
];

export function TrainingScreen() {
  const { member, refreshMemberData, addToast } = useAppStore();
  const [selectedDrill, setSelectedDrill] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'drills' | 'stats' | 'history'>('drills');
  const [attempts, setAttempts] = useState<boolean[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleAttempt = (success: boolean) => {
    if (attempts.length < (selectedDrill?.target || 50)) {
      setAttempts([...attempts, success]);
    }
  };

  const handleSaveTraining = async () => {
    if (!selectedDrill || !member) return;
    
    setIsSaving(true);
    try {
        const successCount = attempts.filter(a => a === true).length;
        const res = await api.post('/player/training/submit', {
            memberId: member.id,
            drillId: selectedDrill.name,
            xpReward: selectedDrill.xpReward,
            successCount,
            totalTarget: selectedDrill.target
        });

        if (res.data.success) {
            addToast({ 
                title: 'LATIHAN BERHASIL', 
                message: `Selamat! Anda mendapatkan +${res.data.xpEarned} XP.`,
                type: 'success' 
            });
            await refreshMemberData();
            setSelectedDrill(null);
            setAttempts([]);
        }
    } catch (error: any) {
        addToast({ 
            title: 'GAGAL MENYIMPAN', 
            message: error.response?.data?.message || 'Terjadi kesalahan sistem.',
            type: 'error' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  const progress = (attempts.length / (selectedDrill?.target || 50)) * 100;

  if (selectedDrill) {
    return (
      <div className="fade-in space-y-8 pb-32 px-4 pt-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
                if (isSaving) return;
                setSelectedDrill(null);
                setAttempts([]);
            }} 
            className="w-10 h-10 rounded-[18px] bg-[#1a1f35] flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase text-white leading-none">MODE <span className="text-primary">LATIHAN</span></h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{selectedDrill.name}</p>
          </div>
        </div>

        <div className="fiery-card p-8 border-2 border-primary/20">
            <div className="flex justify-between items-start mb-6">
                <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    <span className="text-[8px] font-black text-primary uppercase italic tracking-widest">{selectedDrill.difficulty}</span>
                </div>
                <div className="text-right">
                    <p className="text-[8px] text-slate-500 uppercase font-black mb-1">XP Reward</p>
                    <p className="text-xs font-black text-white italic">+{selectedDrill.xpReward} XP</p>
                </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-8 italic">{selectedDrill.description}</p>

            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Progress Latihan</span>
                    <span className="text-xl font-black text-primary italic">{attempts.length}/{selectedDrill.target}</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div 
                        className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: selectedDrill.target }).map((_, i) => (
                <div 
                    key={i} 
                    className={`aspect-square rounded-xl border flex items-center justify-center transition-all ${
                        attempts[i] === true ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' :
                        attempts[i] === false ? 'bg-red-500/20 border-red-500/40 text-red-500' :
                        'bg-[#1a1f35]/50 border-white/5 text-slate-700'
                    }`}
                >
                    <span className="text-[10px] font-black italic">{i + 1}</span>
                </div>
            ))}
        </div>

        {attempts.length < selectedDrill.target ? (
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleAttempt(false)}
                    className="py-6 rounded-[24px] bg-red-500/10 border border-red-500/20 flex flex-col items-center gap-2 active:scale-95 transition-all"
                >
                    <XCircle className="w-8 h-8 text-red-500" />
                    <span className="text-[10px] font-black text-red-500 uppercase italic tracking-widest">Missed</span>
                </button>
                <button 
                    onClick={() => handleAttempt(true)}
                    className="py-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-2 active:scale-95 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.1)]"
                >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase italic tracking-widest">Scored</span>
                </button>
            </div>
        ) : (
            <button 
                onClick={handleSaveTraining}
                disabled={isSaving}
                className="w-full py-5 fiery-btn-primary rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] italic shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SIMPAN HASIL LATIHAN'}
            </button>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8 pb-32">
      <div className="flex items-center px-4 pt-8">
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white leading-none">PLAYER <span className="text-primary italic">TRAINING</span></h1>
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Grit & Discipline Protocol</p>
        </div>
      </div>

      <div className="flex bg-[#1a1f35]/50 p-1.5 rounded-2xl border border-white/5 mx-4">
        {[
          { id: 'drills', label: 'Drills', icon: Target },
          { id: 'stats', label: 'Analisis', icon: BarChart3 },
          { id: 'history', label: 'Riwayat', icon: History }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'drills' && DRILLS.map((drill) => (
          <div 
            key={drill.id} 
            onClick={() => setSelectedDrill(drill)}
            className="fiery-card p-6 rounded-[28px] bg-[#1a1f35]/30 border border-white/5 flex items-center gap-6 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/50 transition-all">
                <Target className="w-6 h-6 text-slate-600 group-hover:text-primary transition-all" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black text-primary uppercase italic tracking-widest">{drill.difficulty}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-[8px] font-black text-slate-500 uppercase italic tracking-widest">+{drill.xpReward} XP</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter truncate">{drill.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">Target: {drill.target} Percobaan</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-700 group-hover:text-white group-hover:bg-primary transition-all">
                <Play className="w-4 h-4 fill-current" />
            </div>
          </div>
        ))}

        {activeTab === 'stats' && (
            <div className="fiery-card py-20 text-center border-dashed border-white/10 opacity-70">
                <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Analisis data membutuhkan minimal 5 sesi latihan.</p>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="fiery-card py-20 text-center border-dashed border-white/10 opacity-70">
                <History className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Belum ada riwayat latihan.</p>
            </div>
        )}
      </div>

      <div className="px-4">
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-black text-white uppercase italic tracking-widest mb-1">Weekly Challenge</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold leading-tight">Selesaikan 10 drill minggu ini untuk klaim Badge "Dedicated Player".</p>
            </div>
        </div>
      </div>
    </div>
  );
}

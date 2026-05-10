import { useRef, useState } from 'react';
import { X, Download, Sparkles, Loader2 } from 'lucide-react';
import { vamosAlert } from '../utils/dialog';

interface FlyerBuilderProps {
    tournament: any;
    onClose: () => void;
}

export function FlyerBuilder({ tournament, onClose }: FlyerBuilderProps) {
    const [generating, setGenerating] = useState(false);
    const flyerRef = useRef<HTMLDivElement>(null);

    // This is where we will eventually integrate html2canvas or similar
    const handleDownload = async () => {
        setGenerating(true);
        try {
            // TODO: Install html2canvas (npm i html2canvas) and implement
            vamosAlert('Fitur download sedang dibangun. Menunggu library render dan finalisasi desain.');
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    // Format date for display
    const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : 'Tanggal Belum Ditentukan';

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#141414] border border-[#222222] rounded-2xl w-full max-w-5xl flex overflow-hidden shadow-2xl h-[85vh]">
                
                {/* Left Panel - Flyer Preview */}
                <div className="flex-1 bg-[#0a0a0a] relative p-8 flex items-center justify-center overflow-y-auto">
                    {/* Flyer Canvas / Template Container */}
                    <div 
                        ref={flyerRef}
                        className="relative w-full max-w-[500px] aspect-[4/5] bg-gradient-to-br from-[#0f172a] to-[#020617] rounded-lg shadow-2xl overflow-hidden border border-white/10"
                        style={{
                            backgroundImage: 'url("/tournament-bg-1.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundBlendMode: 'overlay'
                        }}
                    >
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

                        {/* Content */}
                        <div className="absolute inset-0 p-8 flex flex-col justify-between">
                            {/* Header / Brand */}
                            <div className="text-center mt-4">
                                {/* Placeholder for Vamos Logo */}
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="font-black text-white text-xs">LOGO</span>
                                </div>
                                <h4 className="text-yellow-500 font-bold tracking-[0.3em] text-xs uppercase mb-2">
                                    VAMOS SMART ARENA PRESENTS
                                </h4>
                            </div>

                            {/* Main Title */}
                            <div className="text-center">
                                <h1 className="text-4xl font-black text-white uppercase italic leading-none mb-4" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                                    {tournament.name}
                                </h1>
                                <div className="inline-block bg-[#00ff66]/20 border border-[#00ff66]/50 text-[#00ff66] px-4 py-1 rounded-full font-bold text-sm tracking-widest uppercase backdrop-blur-md">
                                    Total Prize: Rp {tournament.prizePool?.toLocaleString('id-ID')}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 mb-4">
                                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Jadwal Pertandingan</p>
                                            <p className="text-white text-sm font-bold">{dateStr}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Biaya Pendaftaran</p>
                                            <p className="text-white text-sm font-bold">Rp {tournament.entryFee?.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Format</p>
                                            <p className="text-white text-sm font-bold uppercase">{tournament.eliminationType || 'SINGLE'} ELIMINATION</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Slot Tersedia</p>
                                            <p className="text-white text-sm font-bold">{tournament.maxPlayers} Players</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Prize Distribution */}
                                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 backdrop-blur-md border border-yellow-500/30 p-4 rounded-xl flex justify-between items-center text-center">
                                    <div>
                                        <p className="text-yellow-500 text-[10px] font-bold uppercase">Champion</p>
                                        <p className="text-white font-black">Rp {tournament.prizeChampion?.toLocaleString('id-ID') || '-'}</p>
                                    </div>
                                    <div className="w-px h-8 bg-yellow-500/30"></div>
                                    <div>
                                        <p className="text-yellow-500 text-[10px] font-bold uppercase">Runner Up</p>
                                        <p className="text-white font-black">Rp {tournament.prizeRunnerUp?.toLocaleString('id-ID') || '-'}</p>
                                    </div>
                                    <div className="w-px h-8 bg-yellow-500/30"></div>
                                    <div>
                                        <p className="text-yellow-500 text-[10px] font-bold uppercase">Semi Final</p>
                                        <p className="text-white font-black">Rp {tournament.prizeSemiFinal?.toLocaleString('id-ID') || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Controls */}
                <div className="w-80 bg-[#141414] border-l border-[#222222] flex flex-col">
                    <div className="p-4 border-b border-[#222222] flex justify-between items-center">
                        <h2 className="font-bold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" /> Flyer Builder
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222222]">
                            <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Setup Status</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2 text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Default Background Active</li>
                                <li className="flex items-center gap-2 text-yellow-500"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Menunggu Logo Transparan</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-yellow-500 uppercase tracking-widest block flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> AI Prompt Generator
                            </label>
                            <p className="text-[10px] text-gray-500 leading-relaxed mb-2">
                                Ingin background yang berbeda? Copy prompt di bawah ini ke <strong>Midjourney / DALL-E</strong> untuk menghasilkan background turnamen kelas dunia yang sesuai dengan tema ini.
                            </p>
                            <div className="relative">
                                <textarea 
                                    readOnly
                                    className="w-full bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 text-xs text-gray-300 resize-none h-32 focus:border-yellow-500 focus:outline-none leading-relaxed"
                                    value={`A highly professional, dark cinematic background for a billiards tournament flyer titled "${tournament.name}". Neon accents (green and gold), luxury pool table edge visible at the bottom, moody lighting, lots of empty dark space in the center and top for text overlay. 9-ball theme, high resolution, modern elegant luxury style, no text in the image, --ar 4:5 --v 6.0`}
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`A highly professional, dark cinematic background for a billiards tournament flyer titled "${tournament.name}". Neon accents (green and gold), luxury pool table edge visible at the bottom, moody lighting, lots of empty dark space in the center and top for text overlay. 9-ball theme, high resolution, modern elegant luxury style, no text in the image, --ar 4:5 --v 6.0`);
                                        vamosAlert('Prompt disalin! Paste ke Midjourney atau DALL-E.');
                                    }}
                                    className="absolute bottom-2 right-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#222222]">
                        <button 
                            onClick={handleDownload}
                            disabled={generating}
                            className="w-full py-3 bg-[#00ff66] text-black font-black uppercase tracking-widest rounded-xl hover:bg-[#00e65c] transition-all flex items-center justify-center gap-2"
                        >
                            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Export Flyer</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

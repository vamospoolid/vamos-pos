import { useState } from 'react';
import { X, Sparkles, Loader2, Copy, FileText, Image as ImageIcon, Send, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { vamosAlert } from '../utils/dialog';
import { FlyerCanvasEditor } from './FlyerCanvasEditor';

interface FlyerBuilderProps {
    tournament: any;
    onClose: () => void;
}

type TabType = 'tournament' | 'multimodal';

export function FlyerBuilder({ tournament, onClose }: FlyerBuilderProps) {
    const [activeTab, setActiveTab] = useState<TabType>('tournament');
    const [generating, setGenerating] = useState(false);

    // Tournament AI States
    const [imagePrompt, setImagePrompt] = useState('');
    const [caption, setCaption] = useState('');

    // Multimodal AI States
    const [briefText, setBriefText] = useState('Promo Kopi Susu Aren Beli 1 Gratis 1 khusus hari Jumat jam 13.00 - 17.00 WIB');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [multiCaption, setMultiCaption] = useState('');

    // Dynamic props for the canvas editor
    const [canvasProps, setCanvasProps] = useState({
        title: tournament.name,
        prizePool: tournament.prizePool || 0,
        entryFee: tournament.entryFee || 0,
        rules: tournament.rules || 'Sistem Gugur\nHandicap 4, 5, 6\nMax 64 Peserta',
        date: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : 'Segera Diumumkan',
        venue: tournament.venue || 'Vamos Pool & Cafe'
    });

    // Call Gemini to generate Tournament Creative
    const handleGenerateTournamentAI = async () => {
        setGenerating(true);
        try {
            const res = await api.post('/tournaments/creative/generate', {
                name: tournament.name,
                prizePool: tournament.prizePool || 0,
                prizes: `Juara 1: Rp ${tournament.prizeChampion?.toLocaleString('id-ID') || '-'}, Juara 2: Rp ${tournament.prizeRunnerUp?.toLocaleString('id-ID') || '-'}, Semifinal: Rp ${tournament.prizeSemiFinal?.toLocaleString('id-ID') || '-'}`,
                entryFee: tournament.entryFee || 0,
                rules: tournament.rules || 'Sistem Gugur',
                style: 'Cyberpunk Neon & Billiard Hall Glow',
                date: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Segera Diumumkan',
                venue: tournament.venue || 'Vamos Pool & Cafe'
            });

            if (res.data.status === 'success') {
                setImagePrompt(res.data.data.imagePrompt);
                setCaption(res.data.data.caption);
                vamosAlert('Gemini AI berhasil menghasilkan Prompt Poster dan Copywriting Sosmed!');
            }
        } catch (err: any) {
            console.error(err);
            vamosAlert(err.response?.data?.message || 'Gagal menghubungi Gemini AI.');
        } finally {
            setGenerating(false);
        }
    };

    // Handle File Selection for Multimodal
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Call Gemini Multimodal (Analyze Image)
    const handleAnalyzeImageAI = async () => {
        if (!selectedFile) {
            vamosAlert('Harap pilih foto terlebih dahulu.');
            return;
        }
        if (!briefText) {
            vamosAlert('Harap isi brief singkat promo.');
            return;
        }

        setGenerating(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('briefText', briefText);

            const res = await api.post('/tournaments/creative/analyze-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.status === 'success') {
                setMultiCaption(res.data.data.caption);
                const overlayText = res.data.data.overlayText || '';
                
                // Automatically update canvas editor fields to reflect analyzed image data
                setCanvasProps({
                    title: overlayText,
                    prizePool: 0,
                    entryFee: 0,
                    rules: briefText,
                    date: 'Vamos Cafe & Pool',
                    venue: 'Limited Time Promo'
                });

                vamosAlert('Gemini AI telah menganalisis gambar Anda dan membuat saran postingan!');
            }
        } catch (err: any) {
            console.error(err);
            vamosAlert(err.response?.data?.message || 'Gagal menganalisis foto.');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string, msg: string) => {
        navigator.clipboard.writeText(text);
        vamosAlert(msg);
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-[#0c0c0e] border border-zinc-900 rounded-3xl w-full max-w-7xl flex flex-col shadow-2xl h-[92vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-[#0e0e11]">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-950/80 p-2 rounded-xl border border-emerald-800">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-white tracking-wide">Vamos AI Creative & Flyer Automator</h2>
                            <p className="text-xs text-slate-400">Hubungkan info bisnis Anda dengan Google Gemini AI untuk promosi instan.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer">
                        <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex bg-[#0e0e11] px-6 border-b border-zinc-900">
                    <button
                        onClick={() => setActiveTab('tournament')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'tournament'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <FileText className="w-4 h-4" /> Flyer Turnamen (Gemini AI)
                    </button>
                    <button
                        onClick={() => setActiveTab('multimodal')}
                        className={`py-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'multimodal'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <ImageIcon className="w-4 h-4" /> Automasi Konten Cafe / F&B (Multimodal)
                    </button>
                </div>

                {/* Main Body Split */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    
                    {/* Left Column: AI Parameters & Outputs (5/12 span) */}
                    <div className="lg:col-span-4 border-r border-zinc-900 p-6 flex flex-col gap-6 overflow-y-auto bg-[#0a0a0c]">
                        {activeTab === 'tournament' ? (
                            <>
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black tracking-wider uppercase text-emerald-500 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-800/60">Langkah 1</span>
                                    <h3 className="text-sm font-bold text-white">Generate Copywriting & Prompt</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Gemini AI akan membaca detail turnamen <strong>{tournament.name}</strong> dan merancang prompt poster yang pas serta caption promosi media sosial.
                                    </p>
                                    <button
                                        onClick={handleGenerateTournamentAI}
                                        disabled={generating}
                                        className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Menghubungi Gemini AI...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" /> Buat Teks & Prompt dengan AI
                                            </>
                                        )}
                                    </button>
                                </div>

                                {imagePrompt && (
                                    <div className="space-y-2 animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <span>📋 Prompt Generator Gambar AI</span>
                                            </label>
                                            <button
                                                onClick={() => copyToClipboard(imagePrompt, 'Prompt disalin! Tempel di Bing Image Creator / Midjourney.')}
                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3" /> Salin Prompt
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={imagePrompt}
                                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-slate-300 h-24 focus:outline-none leading-relaxed"
                                        />
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            *Salin teks bahasa inggris di atas, render di web gratis seperti <strong>Bing Image Creator</strong>, lalu upload hasilnya di panel kanan.
                                        </p>
                                    </div>
                                )}

                                {caption && (
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">✍️ Copywriting Caption Sosmed</label>
                                            <button
                                                onClick={() => copyToClipboard(caption, 'Caption disalin! Siap diposting di WA / Instagram.')}
                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3" /> Salin Caption
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={caption}
                                            className="w-full flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-slate-300 focus:outline-none leading-relaxed resize-none min-h-[220px]"
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-black tracking-wider uppercase text-emerald-500 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-800/60">Langkah 1</span>
                                        <h3 className="text-sm font-bold text-white mt-2">Upload Foto Kopi / F&B / Cafe</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Kirim foto produk kopi, makanan, atau suasana meja biliar Anda.
                                        </p>
                                    </div>

                                    {/* Dropzone File */}
                                    <div
                                        onClick={() => document.getElementById('multimodal-file')?.click()}
                                        className="border border-dashed border-zinc-800 hover:border-emerald-700 bg-zinc-950/40 hover:bg-emerald-950/5 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]"
                                    >
                                        <input
                                            id="multimodal-file"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-h-28 rounded-lg object-contain"
                                            />
                                        ) : (
                                            <>
                                                <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                                                <span className="text-xs text-slate-400 font-medium">Klik untuk pilih foto cafe / F&B</span>
                                                <span className="text-[10px] text-slate-600 mt-1">JPEG, PNG atau WebP</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Brief Input */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Garis Besar Promo / Brief Teks</label>
                                        <textarea
                                            value={briefText}
                                            onChange={(e) => setBriefText(e.target.value)}
                                            rows={3}
                                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-600 leading-relaxed resize-none"
                                            placeholder="Tulis detail diskon atau info promo disini..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleAnalyzeImageAI}
                                        disabled={generating || !selectedFile}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-500 text-zinc-950 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Menganalisis Foto...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" /> Analisis dengan Gemini AI
                                            </>
                                        )}
                                    </button>
                                </div>

                                {multiCaption && (
                                    <div className="space-y-2 flex-1 flex flex-col animate-fade-in">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">✍️ Caption Promosi F&B Hasil AI</label>
                                            <button
                                                onClick={() => copyToClipboard(multiCaption, 'Caption disalin!')}
                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3" /> Salin Caption
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={multiCaption}
                                            className="w-full flex-1 bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-slate-300 focus:outline-none leading-relaxed resize-none min-h-[160px]"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Column: Visual Canvas Overlay Editor (8/12 span) */}
                    <div className="lg:col-span-8 overflow-y-auto p-6 bg-[#0f0f12]">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-500 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-800/60">Langkah 2</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                Tempel teks ke gambar & download <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>

                        {/* Mount the Canvas Editor Component */}
                        <FlyerCanvasEditor
                            defaultTitle={canvasProps.title}
                            defaultPrizePool={canvasProps.prizePool}
                            defaultEntryFee={canvasProps.entryFee}
                            defaultRules={canvasProps.rules}
                            defaultDate={canvasProps.date}
                            defaultVenue={canvasProps.venue}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}

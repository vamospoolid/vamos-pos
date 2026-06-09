import React, { useRef, useEffect, useState } from 'react';
import { Download, Upload, Eye, RefreshCw, Type } from 'lucide-react';

interface FlyerCanvasEditorProps {
    defaultTitle?: string;
    defaultPrizePool?: number;
    defaultEntryFee?: number;
    defaultRules?: string;
    defaultDate?: string;
    defaultVenue?: string;
}

type AspectRatio = 'portrait' | 'square' | 'story';

export const FlyerCanvasEditor: React.FC<FlyerCanvasEditorProps> = ({
    defaultTitle = 'VAMOS TOURNAMENT',
    defaultPrizePool = 5000000,
    defaultEntryFee = 150000,
    defaultRules = 'Sistem Gugur\nHandicap 4, 5, 6\nMax 64 Peserta',
    defaultDate = 'Sabtu, 20 Juni 2026',
    defaultVenue = 'Vamos Pool & Cafe'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Canvas State
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
    const [bgImageUrl, setBgImageUrl] = useState<string>('');
    const [fontFamily, setFontFamily] = useState<string>('Impact');
    const [textColor, setTextColor] = useState<string>('#00ff66'); // Default Vamos Green
    const [accentColor, setAccentColor] = useState<string>('#ffd700'); // Gold
    const [useGlow, setUseGlow] = useState<boolean>(true);
    
    // Text Content & Y Positions
    const [title, setTitle] = useState(defaultTitle);
    const [titleY, setTitleY] = useState(120);
    const [titleSize, setTitleSize] = useState(48);

    const [prize, setPrize] = useState(`TOTAL HADIAH: Rp ${defaultPrizePool.toLocaleString('id-ID')}`);
    const [prizeY, setPrizeY] = useState(220);
    const [prizeSize, setPrizeSize] = useState(36);

    const [fee, setFee] = useState(`Registrasi: Rp ${defaultEntryFee.toLocaleString('id-ID')}`);
    const [feeY, setFeeY] = useState(300);
    const [feeSize, setFeeSize] = useState(28);

    const [rules, setRules] = useState(defaultRules);
    const [rulesY, setRulesY] = useState(420);
    const [rulesSize, setRulesSize] = useState(24);

    const [date, setDate] = useState(defaultDate);
    const [dateY, setDateY] = useState(700);

    const [venue, setVenue] = useState(defaultVenue);
    const [venueY, setVenueY] = useState(750);

    // Dapatkan dimensi berdasarkan aspek rasio
    const getCanvasDimensions = (ratio: AspectRatio) => {
        switch (ratio) {
            case 'portrait': return { width: 1080, height: 1350 };
            case 'square': return { width: 1080, height: 1080 };
            case 'story': return { width: 1080, height: 1920 };
        }
    };

    const dimensions = getCanvasDimensions(aspectRatio);

    // Handle File Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setBgImage(img);
            };
            img.src = event.target?.result as string;
            setBgImageUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Trigger input file klik
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    // Render Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Background Image
        if (bgImage) {
            // Cek aspek rasio gambar agar pas (cover)
            const imgRatio = bgImage.width / bgImage.height;
            const canvasRatio = canvas.width / canvas.height;
            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > canvasRatio) {
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawHeight = canvas.width / imgRatio;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
        } else {
            // Background default gelap biliar
            ctx.fillStyle = '#0a0a0d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Tambah variasi garis biliar
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
            ctx.lineWidth = 2;
            for (let i = 0; i < canvas.width; i += 80) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
        }

        // 2. Draw Vignette/Overlay Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(10, 10, 15, 0.4)');
        gradient.addColorStop(0.3, 'rgba(10, 10, 15, 0.1)');
        gradient.addColorStop(0.7, 'rgba(10, 10, 15, 0.5)');
        gradient.addColorStop(1, 'rgba(5, 5, 8, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 3. Draw Title
        ctx.save();
        ctx.font = `bold ${titleSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        if (useGlow) {
            ctx.shadowColor = textColor;
            ctx.shadowBlur = 18;
        }
        ctx.fillText(title.toUpperCase(), canvas.width / 2, titleY);
        ctx.restore();

        // 4. Draw Prize
        ctx.save();
        ctx.font = `bold ${prizeSize}px ${fontFamily}`;
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'center';
        if (useGlow) {
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = 15;
        }
        ctx.fillText(prize.toUpperCase(), canvas.width / 2, prizeY);
        ctx.restore();

        // 5. Draw Fee
        ctx.save();
        ctx.font = `bold ${feeSize}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(fee, canvas.width / 2, feeY);
        ctx.restore();

        // 6. Draw Rules (Multi-line)
        ctx.save();
        ctx.font = `${rulesSize}px 'Outfit', sans-serif`;
        ctx.fillStyle = '#cbd5e1'; // slate-300
        ctx.textAlign = 'center';
        const ruleLines = rules.split('\n');
        ruleLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, rulesY + (index * (rulesSize + 12)));
        });
        ctx.restore();

        // 7. Draw Date & Time
        ctx.save();
        ctx.font = `bold 24px ${fontFamily}`;
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'center';
        ctx.fillText(date, canvas.width / 2, dateY);
        ctx.restore();

        // 8. Draw Venue
        ctx.save();
        ctx.font = `bold 24px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        if (useGlow) {
            ctx.shadowColor = textColor;
            ctx.shadowBlur = 10;
        }
        ctx.fillText(`📍 ${venue.toUpperCase()}`, canvas.width / 2, venueY);
        ctx.restore();

    }, [
        aspectRatio, bgImage, fontFamily, textColor, accentColor, useGlow,
        title, titleY, titleSize,
        prize, prizeY, prizeSize,
        fee, feeY, feeSize,
        rules, rulesY, rulesSize,
        date, dateY,
        venue, venueY
    ]);


    // Handle Download
    const downloadFlyer = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Flyer_${title.replace(/\s+/g, '_')}_${aspectRatio}.png`;
        link.href = url;
        link.click();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0f0f13] border border-emerald-950 p-6 rounded-2xl">
            {/* Kiri: Panel Kontrol Input */}
            <div className="lg:col-span-7 space-y-6 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        <Type className="text-emerald-500 w-5 h-5" /> Kustomisasi Visual Poster
                    </h3>
                    <p className="text-slate-400 text-xs">Posisikan dan hias teks poster agar kontras dengan gambar.</p>
                </div>

                {/* Baris 1: Ratio & Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Aspek Rasio Poster</label>
                        <div className="flex gap-2">
                            {(['portrait', 'square', 'story'] as AspectRatio[]).map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${
                                        aspectRatio === ratio
                                            ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/50'
                                            : 'bg-zinc-900 border-zinc-800 text-slate-400 hover:border-zinc-700'
                                    }`}
                                >
                                    {ratio === 'portrait' ? 'Portrait (4:5)' : ratio === 'square' ? 'Square (1:1)' : 'Story (9:16)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gambar Background</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            onClick={triggerFileSelect}
                            className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-dashed border-zinc-800 hover:border-emerald-700 hover:bg-emerald-950/20 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-all"
                        >
                            <Upload className="w-4 h-4 text-emerald-500" />
                            {bgImage ? 'Ganti Background' : 'Upload BG AI / Foto Kopi'}
                        </button>
                    </div>
                </div>

                {/* Baris 2: Font & Tema Warna */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Gaya Font</label>
                        <select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-600"
                        >
                            <option value="Impact">Impact (Futuristik / Bold)</option>
                            <option value="'Arial Black', sans-serif">Arial Black (Sporty)</option>
                            <option value="'Montserrat', sans-serif">Montserrat (Modern Clean)</option>
                            <option value="'Courier New', monospace">Courier New (Retro Arcade)</option>
                            <option value="Georgia, serif">Georgia (Classic Premium)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Warna Utama</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{textColor}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Warna Aksen</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{accentColor}</span>
                        </div>
                    </div>
                </div>

                {/* Efek Glow & Layout Control */}
                <div className="flex items-center gap-6 bg-zinc-950/40 p-3 px-4 border border-zinc-900 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useGlow}
                            onChange={(e) => setUseGlow(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-800 focus:ring-0"
                        />
                        <span className="text-xs text-slate-300 font-semibold">Gunakan Efek Cahaya Neon (Glow)</span>
                    </label>
                </div>

                {/* Input Teks & Posisi */}
                <div className="space-y-4">
                    {/* 1. Judul */}
                    <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-950/30">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">1. Judul Flyer</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mb-3"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400">Posisi Tinggi (Y): {titleY}px</span>
                                <input type="range" min="50" max="400" value={titleY} onChange={(e) => setTitleY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Ukuran Font: {titleSize}px</span>
                                <input type="range" min="20" max="80" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* 2. Hadiah */}
                    <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-950/30">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">2. Tagline / Total Hadiah</label>
                        <input
                            type="text"
                            value={prize}
                            onChange={(e) => setPrize(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mb-3"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400">Posisi Tinggi (Y): {prizeY}px</span>
                                <input type="range" min="150" max="600" value={prizeY} onChange={(e) => setPrizeY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Ukuran Font: {prizeSize}px</span>
                                <input type="range" min="15" max="60" value={prizeSize} onChange={(e) => setPrizeSize(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Registrasi */}
                    <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-950/30">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">3. Info Biaya Registrasi</label>
                        <input
                            type="text"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mb-3"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400">Posisi Tinggi (Y): {feeY}px</span>
                                <input type="range" min="200" max="700" value={feeY} onChange={(e) => setFeeY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Ukuran Font: {feeSize}px</span>
                                <input type="range" min="12" max="50" value={feeSize} onChange={(e) => setFeeSize(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* 4. Aturan */}
                    <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-950/30">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">4. Aturan / Handicap (Gunakan Enter untuk baris baru)</label>
                        <textarea
                            value={rules}
                            onChange={(e) => setRules(e.target.value)}
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white mb-3 focus:outline-none focus:border-emerald-600"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400">Posisi Tinggi (Y): {rulesY}px</span>
                                <input type="range" min="300" max="1000" value={rulesY} onChange={(e) => setRulesY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Ukuran Font: {rulesSize}px</span>
                                <input type="range" min="10" max="40" value={rulesSize} onChange={(e) => setRulesSize(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                        </div>
                    </div>

                    {/* 5. Tanggal & Lokasi */}
                    <div className="p-4 border border-zinc-900 rounded-xl bg-zinc-950/30">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">5. Tanggal & Lokasi (Bagian Bawah)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <span className="text-[10px] text-slate-400">Teks Tanggal</span>
                                <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Teks Lokasi</span>
                                <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400">Tinggi Tanggal Y: {dateY}px</span>
                                <input type="range" min="600" max="1800" value={dateY} onChange={(e) => setDateY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400">Tinggi Lokasi Y: {venueY}px</span>
                                <input type="range" min="650" max="1850" value={venueY} onChange={(e) => setVenueY(Number(e.target.value))} className="w-full accent-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanan: Preview Flyer */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-l border-zinc-900 pt-6 lg:pt-0 lg:pl-6">
                <div className="w-full text-center mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-950/50 border border-emerald-800 text-emerald-400">
                        <Eye className="w-3.5 h-3.5" /> Live Preview
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2">Geser slider posisi/ukuran jika teks terpotong.</p>
                </div>

                {/* Viewport Canvas dengan rasio fleksibel */}
                <div className="relative w-full max-w-[320px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        className="w-full h-auto max-h-[460px] object-contain block bg-[#0a0a0d]"
                    />
                </div>

                <div className="w-full mt-6 space-y-3">
                    <button
                        onClick={downloadFlyer}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                        <Download className="w-5 h-5 stroke-[2.5]" /> Unduh Flyer PNG
                    </button>
                    {bgImageUrl && (
                        <button
                            onClick={() => {
                                setBgImage(null);
                                setBgImageUrl('');
                            }}
                            className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-400 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Gunakan Default Canvas
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

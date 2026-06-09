import React from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, HelpCircle } from 'lucide-react';

export const vamosAlert = (message: string) => {
    return new Promise<void>((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const close = () => {
            root.unmount();
            container.remove();
            resolve();
        };

        const Component = () => (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#141414] border border-[#222222] p-6 rounded-2xl w-[400px] shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-bold mb-2 flex items-center text-white">
                        <AlertCircle className="w-6 h-6 mr-2 text-yellow-500" />
                        System Notification
                    </h3>
                    <p className="text-gray-300 mb-6" style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
                    <button onClick={close} className="w-full py-2 bg-[#00ff66] text-black font-bold rounded-lg hover:bg-[#00e65c]">OK</button>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

export const vamosConfirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const complete = (res: boolean) => {
            root.unmount();
            container.remove();
            resolve(res);
        };

        const Component = () => (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#141414] border border-[#222222] p-6 rounded-2xl w-[400px] shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-bold mb-2 flex items-center text-white">
                        <HelpCircle className="w-6 h-6 mr-2 text-[#00aaff]" />
                        Confirmation
                    </h3>
                    <p className="text-gray-300 mb-6">{message}</p>
                    <div className="flex space-x-3">
                        <button onClick={() => complete(false)} className="flex-1 py-2 bg-[#0a0a0a] border border-[#222222] text-white font-bold rounded-lg hover:bg-white/5">Cancel</button>
                        <button onClick={() => complete(true)} className="flex-1 py-2 bg-[#00ff66] text-black font-bold rounded-lg hover:bg-[#00e65c]">Confirm</button>
                    </div>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

/** Legacy single-method picker (kept for backward compat) */
export const vamosPaymentMethod = (message: string) => {
    return new Promise<'CASH' | 'QRIS' | null>((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const complete = (res: 'CASH' | 'QRIS' | null) => {
            root.unmount();
            container.remove();
            resolve(res);
        };

        const Component = () => (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#141414] border border-[#222222] p-6 rounded-3xl w-full max-w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-xl font-black mb-2 flex items-center text-white italic tracking-tight">
                        <HelpCircle className="w-6 h-6 mr-3 text-[#00ff66]" />
                        Metode Pembayaran
                    </h3>
                    <p className="text-sm text-gray-400 mb-8 leading-relaxed">{message}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button onClick={() => complete('CASH')}
                            className="aspect-square bg-[#0a0a0a] border-2 border-[#1e1e1e] hover:border-[#00ff66] hover:bg-[#00ff66]/5 text-white font-bold rounded-3xl flex flex-col items-center justify-center transition-all group active:scale-95">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00ff66]/10 group-hover:scale-110 transition-all">
                                <span className="text-3xl">💵</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-[#00ff66]">CASH</span>
                        </button>
                        <button onClick={() => complete('QRIS')}
                            className="aspect-square bg-[#0a0a0a] border-2 border-[#1e1e1e] hover:border-[#00ff66] hover:bg-[#00ff66]/5 text-white font-bold rounded-3xl flex flex-col items-center justify-center transition-all group active:scale-95">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00ff66]/10 group-hover:scale-110 transition-all">
                                <span className="text-3xl">📱</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-[#00ff66]">QRIS</span>
                        </button>
                    </div>
                    <button onClick={() => complete(null)}
                        className="w-full py-4 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-2xl">
                        Batal
                    </button>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

/**
 * SPLIT PAYMENT DIALOG
 * Mendukung 3 mode: CASH only, QRIS only, atau SPLIT (QRIS + CASH).
 * Mengembalikan amount breakdown yang siap dikirim ke API.
 */
export type SplitPaymentResult = {
    mode: 'CASH' | 'QRIS' | 'SPLIT';
    qrisAmount: number;
    cashAmount: number;
    cashReceived: number;
} | null;

export const vamosPaymentSplit = (totalAmount: number): Promise<SplitPaymentResult> => {
    return new Promise((resolve) => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);

        const complete = (res: SplitPaymentResult) => {
            root.unmount();
            container.remove();
            resolve(res);
        };

        const Component = () => {
            const [mode, setMode] = React.useState<'CASH' | 'QRIS' | 'SPLIT'>('CASH');
            const [qrisInput, setQrisInput] = React.useState(0);
            const [cashReceived, setCashReceived] = React.useState(0);

            const cashPortion = Math.max(0, totalAmount - qrisInput);
            const change = Math.max(0, cashReceived - cashPortion);

            const isValid = mode === 'QRIS'
                ? true
                : mode === 'CASH'
                    ? cashReceived >= totalAmount
                    : qrisInput > 0 && qrisInput < totalAmount && cashReceived >= cashPortion;

            const handleConfirm = () => {
                if (mode === 'QRIS') {
                    complete({ mode: 'QRIS', qrisAmount: totalAmount, cashAmount: 0, cashReceived: totalAmount });
                } else if (mode === 'CASH') {
                    complete({ mode: 'CASH', qrisAmount: 0, cashAmount: totalAmount, cashReceived });
                } else {
                    complete({ mode: 'SPLIT', qrisAmount: qrisInput, cashAmount: cashPortion, cashReceived });
                }
            };

            return (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-3xl w-full max-w-[440px] shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                        {/* Header */}
                        <div className="p-5 pb-4 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border-b border-[#222]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/20 flex items-center justify-center">
                                    <span className="text-lg">💳</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base italic tracking-tight leading-none">Pilih Metode Bayar</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                        Total: Rp {totalAmount.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Mode Selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {(['CASH', 'QRIS', 'SPLIT'] as const).map((m) => (
                                    <button key={m}
                                        onClick={() => { setMode(m); setQrisInput(0); setCashReceived(0); }}
                                        className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            mode === m
                                                ? m === 'SPLIT'
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                    : 'bg-[#00ff66]/10 border-[#00ff66] text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.1)]'
                                                : 'bg-[#0a0a0a] border-[#222] text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                        }`}>
                                        {m === 'CASH' ? '💵 Cash' : m === 'QRIS' ? '📱 QRIS' : '⚡ Split'}
                                    </button>
                                ))}
                            </div>

                            {/* CASH Mode */}
                            {mode === 'CASH' && (
                                <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-[#1e1e1e] space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Uang Diterima</span>
                                        <input type="text"
                                            value={cashReceived ? cashReceived.toLocaleString('id-ID') : ''}
                                            onChange={e => setCashReceived(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                            placeholder="0" autoFocus
                                            className="w-36 bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-right text-white font-mono font-black text-lg focus:outline-none focus:border-[#00ff66] transition-all" />
                                    </div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[50000, 100000, 150000, totalAmount].map((amt) => (
                                            <button key={amt} onClick={() => setCashReceived(amt)}
                                                className="py-1.5 rounded-lg bg-[#1a1a1a] border border-[#222] text-[9px] font-black text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66]/30 transition-all">
                                                {amt === totalAmount ? 'PAS' : `${amt / 1000}K`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-[#1e1e1e]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kembalian</span>
                                        <span className={`font-mono font-black text-xl ${cashReceived >= totalAmount ? 'text-[#00aaff]' : 'text-red-500'}`}>
                                            Rp {Math.max(0, cashReceived - totalAmount).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* QRIS Mode */}
                            {mode === 'QRIS' && (
                                <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-[#1e1e1e] flex flex-col items-center gap-2">
                                    <span className="text-4xl">📱</span>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Scan QR & bayar</p>
                                    <p className="text-2xl font-black text-blue-400 font-mono">Rp {totalAmount.toLocaleString('id-ID')}</p>
                                    <p className="text-[9px] text-gray-600 text-center font-medium">⚠️ Pastikan pembayaran berhasil di HP pelanggan</p>
                                </div>
                            )}

                            {/* SPLIT Mode */}
                            {mode === 'SPLIT' && (
                                <div className="bg-[#0a0a0a] rounded-2xl p-4 border border-purple-500/20 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">Bayar Sebagian QRIS</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nominal QRIS</span>
                                        <input type="text"
                                            value={qrisInput ? qrisInput.toLocaleString('id-ID') : ''}
                                            onChange={e => setQrisInput(Math.min(totalAmount, parseInt(e.target.value.replace(/\D/g, '')) || 0))}
                                            placeholder="0" autoFocus
                                            className="w-36 bg-[#1a1a1a] border border-purple-500/40 rounded-xl px-3 py-2 text-right text-purple-300 font-mono font-black text-lg focus:outline-none focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="flex justify-between items-center bg-[#1a1a1a] rounded-xl px-3 py-2 border border-[#1e1e1e]">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sisa → Cash</span>
                                        <span className="font-mono font-black text-[#00ff66] text-lg">Rp {cashPortion.toLocaleString('id-ID')}</span>
                                    </div>
                                    {cashPortion > 0 && qrisInput > 0 && (
                                        <div className="space-y-2 pt-1 border-t border-[#1e1e1e]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cash Diterima</span>
                                                <input type="text"
                                                    value={cashReceived ? cashReceived.toLocaleString('id-ID') : ''}
                                                    onChange={e => setCashReceived(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                                                    placeholder="0"
                                                    className="w-36 bg-[#1a1a1a] border border-[#333] rounded-xl px-3 py-2 text-right text-white font-mono font-black text-lg focus:outline-none focus:border-[#00ff66] transition-all" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {[50000, 100000, cashPortion].map((amt) => (
                                                    <button key={amt} onClick={() => setCashReceived(amt)}
                                                        className="py-1.5 rounded-lg bg-[#1a1a1a] border border-[#222] text-[9px] font-black text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66]/30 transition-all">
                                                        {amt === cashPortion ? 'PAS' : `${amt / 1000}K`}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-[#1e1e1e]">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kembalian Cash</span>
                                                <span className={`font-mono font-black text-lg ${cashReceived >= cashPortion ? 'text-[#00aaff]' : 'text-red-500'}`}>
                                                    Rp {Math.max(0, change).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => complete(null)}
                                    className="flex-1 py-3.5 rounded-2xl bg-transparent border border-[#222] text-gray-500 font-bold text-xs uppercase tracking-widest hover:border-gray-500 hover:text-white transition-all">
                                    Batal
                                </button>
                                <button onClick={handleConfirm} disabled={!isValid}
                                    className={`flex-[2] py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                                        isValid
                                            ? mode === 'SPLIT'
                                                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-0.5'
                                                : 'bg-[#00ff66] text-[#0a0a0a] hover:bg-[#00e65c] shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:-translate-y-0.5'
                                            : 'bg-[#222] text-gray-600 cursor-not-allowed'
                                    }`}>
                                    {mode === 'SPLIT' ? '⚡ Proses Split' : mode === 'QRIS' ? '✓ Konfirmasi QRIS' : '✓ Proses Bayar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        root.render(<Component />);
    });
};

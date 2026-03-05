import { createRoot } from 'react-dom/client';
import { HelpCircle, Shield, CheckCircle2, X } from 'lucide-react';

/**
 * VAMOS FIERY DIALOG SYSTEM
 * Tactical UI for Command Alerts and Confirmations
 */

export const vamosAlert = (message: string) => {
    return new Promise<void>((resolve) => {
        const container = document.createElement('div');
        container.id = 'vamos-dialog-container';
        document.body.appendChild(container);
        const root = createRoot(container);

        const close = () => {
            root.unmount();
            container.remove();
            resolve();
        };

        const Component = () => (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0d18]/90 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="fiery-card p-10 w-[480px] border-2 border-primary/20 shadow-[0_0_100px_rgba(59,130,246,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-1/2 pointer-events-none opacity-20" />

                    <div className="flex items-center gap-4 mb-8 relative">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 italic">Protocol Alert</p>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">System Notification</h3>
                        </div>
                    </div>

                    <div className="bg-[#101423] p-6 rounded-3xl border border-white/5 mb-8 relative">
                        <p className="text-slate-300 text-sm font-medium italic leading-relaxed uppercase tracking-wide" style={{ whiteSpace: 'pre-wrap' }}>
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={close}
                        className="fiery-btn-primary w-full py-5 text-xs tracking-[0.2em] font-black italic relative overflow-hidden group/btn"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        Acknowledge Protocol
                    </button>

                    <button onClick={close} className="absolute top-6 right-6 p-2 rounded-xl text-slate-600 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

export const vamosConfirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
        const container = document.createElement('div');
        container.id = 'vamos-dialog-container';
        document.body.appendChild(container);
        const root = createRoot(container);

        const complete = (res: boolean) => {
            root.unmount();
            container.remove();
            resolve(res);
        };

        const Component = () => (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0d18]/90 backdrop-blur-xl animate-in fade-in duration-300">
                <div className="fiery-card p-10 w-[480px] border-2 border-primary/20 shadow-[0_0_100px_rgba(59,130,246,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-1/2 pointer-events-none opacity-20" />

                    <div className="flex items-center gap-4 mb-8 relative">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <HelpCircle className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1 italic">Confirmation Required</p>
                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Authorize Mission</h3>
                        </div>
                    </div>

                    <div className="bg-[#101423] p-6 rounded-3xl border border-white/5 mb-8 relative">
                        <p className="text-slate-300 text-sm font-medium italic leading-relaxed uppercase tracking-wide">
                            {message}
                        </p>
                    </div>

                    <div className="flex gap-4 relative">
                        <button
                            onClick={() => complete(false)}
                            className="flex-1 py-5 rounded-[22px] bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all italic border border-white/5 active:scale-95"
                        >
                            Abort
                        </button>
                        <button
                            onClick={() => complete(true)}
                            className="flex-[2] fiery-btn-primary py-5 text-[10px] tracking-[0.2em] relative overflow-hidden group/btn"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            <span className="flex items-center gap-2 justify-center">
                                <CheckCircle2 size={16} strokeWidth={3} /> Authorize
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

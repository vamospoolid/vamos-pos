import { createRoot } from 'react-dom/client';
// import React from 'react';
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
                        <button 
                            onClick={() => complete('CASH')} 
                            className="aspect-square bg-[#0a0a0a] border-2 border-[#1e1e1e] hover:border-[#00ff66] hover:bg-[#00ff66]/5 text-white font-bold rounded-3xl flex flex-col items-center justify-center transition-all group active:scale-95"
                        >
                           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00ff66]/10 group-hover:scale-110 transition-all">
                                <span className="text-3xl">💵</span>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-[#00ff66]">CASH</span>
                        </button>
                        <button 
                            onClick={() => complete('QRIS')} 
                            className="aspect-square bg-[#0a0a0a] border-2 border-[#1e1e1e] hover:border-[#00ff66] hover:bg-[#00ff66]/5 text-white font-bold rounded-3xl flex flex-col items-center justify-center transition-all group active:scale-95"
                        >
                           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00ff66]/10 group-hover:scale-110 transition-all">
                                <span className="text-3xl">📱</span>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-[#00ff66]">QRIS</span>
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => complete(null)} 
                        className="w-full py-4 text-gray-500 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors border border-transparent hover:border-white/10 rounded-2xl"
                    >
                        Batal
                    </button>
                </div>
            </div>
        );
        root.render(<Component />);
    });
};

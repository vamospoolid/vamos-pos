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

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'match';

interface ToastProps {
    id: string;
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: (id: string) => void;
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function Toast({ id, message, type = 'info', duration = 5000, onClose, title, actionLabel, onAction }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        match: <Bell className="w-5 h-5 text-primary animate-pulse" />
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-rose-500/10 border-rose-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-blue-500/10 border-blue-500/20',
        match: 'bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(255,87,34,0.15)]'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`w-full max-w-sm pointer-events-auto overflow-hidden rounded-2xl border-2 p-4 backdrop-blur-xl flex gap-4 ${bgColors[type]}`}
        >
            <div className="shrink-0 pt-0.5">
                {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
                {title && <p className="text-xs font-black text-white uppercase italic tracking-widest mb-1">{title}</p>}
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">{message}</p>
                {actionLabel && (
                    <button 
                        onClick={() => {
                            onAction?.();
                            onClose(id);
                        }}
                        className="mt-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] italic hover:underline"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            <button 
                onClick={() => onClose(id)}
                className="shrink-0 h-6 w-6 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export function ToastContainer({ toasts, removeToast }: { toasts: any[], removeToast: (id: string) => void }) {
    return (
        <div className="fixed bottom-28 left-6 right-6 z-[9999] pointer-events-none flex flex-col items-center gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
}

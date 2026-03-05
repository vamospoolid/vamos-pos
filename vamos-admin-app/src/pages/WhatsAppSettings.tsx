import React, { useEffect, useState } from 'react';
import {
    MessageSquare, Save, RotateCcw, ToggleLeft, ToggleRight,
    CheckCircle2, Loader2, AlertTriangle, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../services/api';

interface WaTemplate {
    id: string;
    name: string;
    body: string;
    imageUrl?: string | null;
    isActive: boolean;
    updatedAt: string;
}


// Variabel yang tersedia per template
const TEMPLATE_VARS: Record<string, string[]> = {
    wa_welcome_member: ['{{name}}', '{{venue}}'],
    wa_payment_receipt: ['{{name}}', '{{venue}}', '{{table}}', '{{amount}}'],
    wa_booking_confirm: ['{{name}}', '{{venue}}', '{{date}}', '{{time}}', '{{table}}'],
    wa_waitlist_confirm: ['{{name}}', '{{venue}}', '{{table}}', '{{time}}'],
    wa_waitlist_ready: ['{{name}}', '{{venue}}'],
};


const WhatsAppSettings: React.FC = () => {
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [resetting, setResetting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [edits, setEdits] = useState<Record<string, { body: string; imageUrl: string | null; isActive: boolean }>>({});


    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get('/whatsapp/templates').then(res => {
            const data: WaTemplate[] = (res.data as any).data;
            setTemplates(data);
            const init: Record<string, { body: string; imageUrl: string | null; isActive: boolean }> = {};
            data.forEach(t => { init[t.id] = { body: t.body, imageUrl: t.imageUrl || null, isActive: t.isActive }; });
            setEdits(init);

        }).catch(() => showToast('Gagal memuat template', 'err'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (id: string) => {
        setSaving(id);
        try {
            const res = await api.put(`/whatsapp/templates/${id}`, edits[id]);
            const updated: WaTemplate = (res.data as any).data;
            setTemplates(prev => prev.map(t => t.id === id ? updated : t));
            showToast('Template disimpan!');
        } catch {
            showToast('Gagal menyimpan template', 'err');
        } finally {
            setSaving(null);
        }
    };

    const handleReset = async (id: string) => {
        setResetting(id);
        try {
            const res = await api.post(`/whatsapp/templates/${id}/reset`);
            const updated: WaTemplate = (res.data as any).data;
            setTemplates(prev => prev.map(t => t.id === id ? updated : t));
            setEdits(prev => ({ ...prev, [id]: { body: updated.body, imageUrl: updated.imageUrl || null, isActive: updated.isActive } }));

            showToast('Template direset ke default!');
        } catch {
            showToast('Reset gagal', 'err');
        } finally {
            setResetting(null);
        }
    };

    const vars = (id: string) => TEMPLATE_VARS[id] || [];

    const isDirty = (id: string) => {
        const tpl = templates.find(t => t.id === id);
        if (!tpl) return false;
        return edits[id]?.body !== tpl.body || edits[id]?.imageUrl !== (tpl.imageUrl || null) || edits[id]?.isActive !== tpl.isActive;
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="fade-in space-y-5 pb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mt-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <MessageSquare size={20} className="text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">WA Auto-Reply</h1>
                    <p className="text-sm font-bold text-slate-500">Edit pesan otomatis WhatsApp</p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-in ${toast.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {toast.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Info */}
            <div className="fiery-card p-4 flex items-start gap-3 border-l-4 border-l-primary">
                <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                    Gunakan variabel <span className="text-primary font-black">{'{{name}}'}</span>, <span className="text-primary font-black">{'{{venue}}'}</span>, dll. untuk menyisipkan data dinamis.
                    Setiap trigger memiliki variabel yang berbeda.
                </p>
            </div>

            {/* Template Cards */}
            {templates.map(tpl => {
                const isExpanded = expanded === tpl.id;
                const edit = edits[tpl.id] || { body: tpl.body, isActive: tpl.isActive };
                const dirty = isDirty(tpl.id);

                return (
                    <div key={tpl.id} className={`fiery-card overflow-hidden transition-all border ${edit.isActive ? 'border-emerald-500/20' : 'border-white/5 opacity-70'
                        }`}>
                        {/* Card Header */}
                        <div
                            className="flex items-center justify-between p-5 cursor-pointer"
                            onClick={() => setExpanded(isExpanded ? null : tpl.id)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${edit.isActive
                                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                                    : 'bg-white/5 border border-white/5'
                                    }`}>
                                    <MessageSquare size={18} className={edit.isActive ? 'text-emerald-400' : 'text-slate-500'} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-black text-white truncate">{tpl.name}</p>
                                    <p className="text-xs font-bold text-slate-500 font-mono">{tpl.id}</p>
                                </div>
                                {dirty && (
                                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex-shrink-0">
                                        Belum disimpan
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                                {/* Toggle Active */}
                                <button
                                    onClick={e => { e.stopPropagation(); setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], isActive: !p[tpl.id]?.isActive } })); }}
                                    className="p-1 transition-all active:scale-90"
                                >
                                    {edit.isActive
                                        ? <ToggleRight size={28} className="text-emerald-400" />
                                        : <ToggleLeft size={28} className="text-slate-600" />
                                    }
                                </button>
                                {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                            </div>
                        </div>

                        {/* Expanded Editor */}
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                                {/* Variables hint */}
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs font-bold text-slate-500">Variabel:</span>
                                    {vars(tpl.id).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], body: p[tpl.id].body + v } }))}
                                            className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 active:scale-95 transition-all"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                {/* Textarea */}
                                <textarea
                                    value={edit.body}
                                    onChange={e => setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], body: e.target.value } }))}
                                    rows={8}
                                    className="w-full bg-[#0e111a] border border-white/10 rounded-2xl p-4 text-sm font-mono text-white focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
                                    placeholder="Tulis template pesan di sini..."
                                />

                                {/* Image URL Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL Gambar (Opsional):</label>
                                    <input
                                        type="text"
                                        value={edit.imageUrl || ''}
                                        onChange={e => setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], imageUrl: e.target.value || null } }))}
                                        className="w-full bg-[#0e111a] border border-white/10 rounded-xl p-3 text-sm font-mono text-white focus:outline-none focus:border-primary/50"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {edit.imageUrl && (
                                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 w-full max-w-xs bg-black/20">
                                            <img
                                                src={edit.imageUrl}
                                                alt="Preview"
                                                className="w-full h-auto object-cover"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL')}
                                            />
                                        </div>
                                    )}
                                </div>


                                {/* Preview */}
                                <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-widest">Preview pesan:</p>
                                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-medium">
                                        {edit.body
                                            .replace(/\{\{name\}\}/g, 'Budi Santoso')
                                            .replace(/\{\{venue\}\}/g, 'Vamos Billiard')
                                            .replace(/\{\{table\}\}/g, 'Meja 01')
                                            .replace(/\{\{amount\}\}/g, '75.000')
                                            .replace(/\{\{date\}\}/g, '10 Maret 2026')
                                            .replace(/\{\{time\}\}/g, '19:00')
                                        }
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReset(tpl.id)}
                                        disabled={resetting === tpl.id}
                                        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm transition-all active:scale-95 hover:bg-white/10"
                                    >
                                        {resetting === tpl.id
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : <RotateCcw size={14} />
                                        }
                                        Reset Default
                                    </button>
                                    <button
                                        onClick={() => handleSave(tpl.id)}
                                        disabled={saving === tpl.id || !dirty}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${dirty
                                            ? 'bg-primary text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)]'
                                            : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                            }`}
                                    >
                                        {saving === tpl.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Save size={16} />
                                        }
                                        Simpan Template
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WhatsAppSettings;

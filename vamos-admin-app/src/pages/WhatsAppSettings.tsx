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
                <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-6">
            
            {/* Header Overlapping Blue Background */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-[28px] p-5 border border-white/20">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                    <MessageSquare size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">WA Auto-Reply</h1>
                    <p className="text-[13px] font-medium text-blue-100">Konfigurasi pesan bot WhatsApp</p>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-in fade-in slide-in-from-top-4 ${
                    toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                }`}>
                    {toast.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-[24px] flex items-start gap-3 border border-blue-100">
                <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] font-medium text-blue-800 leading-relaxed">
                    Gunakan variabel <span className="font-bold text-blue-600">{'{{name}}'}</span>, <span className="font-bold text-blue-600">{'{{venue}}'}</span>, dll. untuk menyisipkan data dinamis.
                    Setiap trigger memiliki variabel yang berbeda.
                </p>
            </div>

            {/* Template Cards */}
            <div className="space-y-4">
                {templates.map(tpl => {
                    const isExpanded = expanded === tpl.id;
                    const edit = edits[tpl.id] || { body: tpl.body, isActive: tpl.isActive };
                    const dirty = isDirty(tpl.id);

                    return (
                        <div key={tpl.id} className={`bg-white rounded-[24px] shadow-sm border transition-all ${
                            edit.isActive ? 'border-emerald-100' : 'border-slate-100 opacity-70'
                        }`}>
                            {/* Card Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer select-none"
                                onClick={() => setExpanded(isExpanded ? null : tpl.id)}
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                        edit.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                        <MessageSquare size={22} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-bold text-slate-800 truncate">{tpl.name}</p>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{tpl.id}</p>
                                    </div>
                                    {dirty && (
                                        <span className="ml-2 text-[10px] px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-bold">
                                            Modified
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 ml-3">
                                    <button
                                        onClick={e => { e.stopPropagation(); setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], isActive: !p[tpl.id]?.isActive } })); }}
                                        className="p-1 transition-all active:scale-90"
                                    >
                                        {edit.isActive
                                            ? <ToggleRight size={32} className="text-emerald-500" />
                                            : <ToggleLeft size={32} className="text-slate-300" />
                                        }
                                    </button>
                                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </div>
                            </div>

                            {/* Expanded Editor */}
                            {isExpanded && (
                                <div className="px-5 pb-6 space-y-5 border-t border-slate-50 pt-5">
                                    {/* Variables hint */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="text-xs font-bold text-slate-500">Vars:</span>
                                        {vars(tpl.id).map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], body: p[tpl.id].body + v } }))}
                                                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 active:scale-95 transition-all"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[13px] font-mono text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none leading-relaxed transition-all"
                                        placeholder="Tulis pesan bot..."
                                    />

                                    {/* Image URL Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">URL Gambar (Opsional)</label>
                                        <input
                                            type="text"
                                            value={edit.imageUrl || ''}
                                            onChange={e => setEdits(p => ({ ...p, [tpl.id]: { ...p[tpl.id], imageUrl: e.target.value || null } }))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[13px] text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                        {edit.imageUrl && (
                                            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 w-full max-w-xs bg-slate-100">
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
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                        <p className="text-[11px] font-bold text-emerald-600 mb-2 uppercase tracking-wider">Preview Pesan:</p>
                                        <p className="text-[13px] text-emerald-900 whitespace-pre-wrap leading-relaxed font-medium">
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
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => handleReset(tpl.id)}
                                            disabled={resetting === tpl.id}
                                            className="px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm transition-all active:scale-95 hover:bg-slate-200 flex items-center gap-2"
                                        >
                                            {resetting === tpl.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                            Reset Default
                                        </button>
                                        <button
                                            onClick={() => handleSave(tpl.id)}
                                            disabled={saving === tpl.id || !dirty}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                                                dirty
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {saving === tpl.id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            Simpan Template
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WhatsAppSettings;

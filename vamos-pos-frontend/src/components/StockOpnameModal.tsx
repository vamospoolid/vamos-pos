import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, ArrowRight, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { vamosAlert, vamosConfirm } from '../utils/dialog';

interface StockOpnameModalProps {
    isOpen: boolean;
    onClose: () => void;
    rawMaterials: any[];
    onSuccess: () => void;
}

export default function StockOpnameModal({ isOpen, onClose, rawMaterials, onSuccess }: StockOpnameModalProps) {
    const [conductedBy, setConductedBy] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [applyAdjustment, setApplyAdjustment] = useState<boolean>(true);
    const [itemsState, setItemsState] = useState<{ [rawId: string]: { physical: string | number; notes: string } }>({});
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Pre-fill physical stock with system stock as starting point
            const initial: { [rawId: string]: { physical: string | number; notes: string } } = {};
            rawMaterials.forEach(m => {
                initial[m.id] = {
                    physical: m.currentStock,
                    notes: ''
                };
            });
            setItemsState(initial);
            setConductedBy('');
            setNotes('');
            setApplyAdjustment(true);
            setSearchQuery('');
        }
    }, [isOpen, rawMaterials]);

    if (!isOpen) return null;

    const handlePhysicalChange = (rawId: string, val: string) => {
        setItemsState(prev => ({
            ...prev,
            [rawId]: {
                ...prev[rawId],
                physical: val
            }
        }));
    };

    const handleItemNoteChange = (rawId: string, val: string) => {
        setItemsState(prev => ({
            ...prev,
            [rawId]: {
                ...prev[rawId],
                notes: val
            }
        }));
    };

    // Calculate live variances
    let totalItems = rawMaterials.length;
    let itemsWithDifference = 0;
    let totalVarianceCost = 0;

    const analyzedItems = rawMaterials.map(m => {
        const entry = itemsState[m.id] || { physical: m.currentStock, notes: '' };
        const physicalNum = entry.physical === '' ? 0 : Number(entry.physical) || 0;
        const systemStock = Number(m.currentStock) || 0;
        const diff = physicalNum - systemStock;
        const costPerUnit = Number(m.costPerUnit) || 0;
        const costDiff = diff * costPerUnit;

        if (diff !== 0) {
            itemsWithDifference++;
            totalVarianceCost += costDiff;
        }

        return {
            material: m,
            systemStock,
            physicalNum,
            diff,
            costDiff,
            note: entry.notes || ''
        };
    });

    const filteredItems = analyzedItems.filter(item =>
        item.material.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const confirmMsg = itemsWithDifference > 0 
            ? `Terdapat ${itemsWithDifference} bahan baku dengan selisih stok (Total Nilai: Rp ${Math.round(totalVarianceCost).toLocaleString()}). ${applyAdjustment ? 'Stok sistem akan langsung disesuaikan dengan fisik.' : ''} Lanjutkan simpan opname?`
            : `Semua stok fisik tercatat pas dengan sistem. Lanjutkan simpan opname?`;

        if (!(await vamosConfirm(confirmMsg))) return;

        try {
            setSubmitting(true);
            const payload = {
                conductedBy: conductedBy.trim() || undefined,
                notes: notes.trim() || undefined,
                applyAdjustment,
                items: analyzedItems.map(a => ({
                    rawMaterialId: a.material.id,
                    physicalStock: a.physicalNum,
                    notes: a.note || undefined
                }))
            };

            const res = await api.post('/inventory/stock-opname', payload);
            vamosAlert(`✅ Stock Opname #${res.data.opnameNumber} berhasil disimpan!`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving stock opname:', err);
            vamosAlert(err.response?.data?.error || 'Gagal menyimpan stock opname');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col max-h-[94vh]">
                {/* Header */}
                <div className="p-4 border-b border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <span>Audit Stock Opname Fisik</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                                    {totalItems} Bahan
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Masukkan hasil hitung fisik di dapur/bar. Sistem akan menghitung selisih dan penyesuaian modal secara presisi.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Controls */}
                <div className="p-4 bg-[#111111] border-b border-[#222222] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Petugas Auditor / Barista
                        </label>
                        <input
                            type="text"
                            value={conductedBy}
                            onChange={(e) => setConductedBy(e.target.value)}
                            placeholder="Contoh: Barista Budi & Kasir Ani"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Catatan Audit
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Opname Akhir Bulan / Shift Pagi"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Cari Bahan di Lembar Checklist
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ketik nama bahan..."
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Table Checklist */}
                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#222222] text-[10px] uppercase tracking-wider text-gray-500 sticky top-0 bg-[#141414] pb-2 z-10">
                                <th className="pb-3 font-semibold">Nama Bahan</th>
                                <th className="pb-3 font-semibold text-center">Satuan</th>
                                <th className="pb-3 font-semibold text-right">Stok Sistem</th>
                                <th className="pb-3 font-semibold text-center w-36">Hitung Fisik Riil</th>
                                <th className="pb-3 font-semibold text-center">Selisih</th>
                                <th className="pb-3 font-semibold text-right">Nilai Selisih (Rp)</th>
                                <th className="pb-3 font-semibold w-40">Catatan Item</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e1e]">
                            {filteredItems.map(item => {
                                const m = item.material;
                                const isShort = item.diff < 0;
                                const isSurplus = item.diff > 0;
                                const isBalanced = item.diff === 0;

                                return (
                                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-2.5 font-bold text-white">
                                            {m.name}
                                            {m.purchaseUnit && (
                                                <span className="block text-[9px] text-gray-500 font-normal">
                                                    Kulakan: {m.purchaseUnit} (x{m.conversionRatio || 1})
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-[#222222] text-gray-400">
                                                {m.unit}
                                            </span>
                                        </td>
                                        <td className="py-2.5 text-right font-mono font-bold text-gray-300">
                                            {item.systemStock.toLocaleString()}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={itemsState[m.id]?.physical ?? item.systemStock}
                                                onChange={(e) => handlePhysicalChange(m.id, e.target.value)}
                                                className={`w-32 bg-[#0a0a0a] border rounded-lg px-2.5 py-1.5 text-center font-mono font-bold text-sm focus:outline-none transition-colors ${
                                                    isShort ? 'border-red-500/60 text-red-400 bg-red-500/5' :
                                                    isSurplus ? 'border-blue-500/60 text-blue-400 bg-blue-500/5' :
                                                    'border-[#333333] text-white focus:border-purple-500'
                                                }`}
                                            />
                                        </td>
                                        <td className="py-2.5 text-center font-mono">
                                            {isBalanced ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Pas (0)
                                                </span>
                                            ) : isShort ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                                                    <TrendingDown className="w-3 h-3" />
                                                    {item.diff.toLocaleString()} {m.unit}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                                                    <TrendingUp className="w-3 h-3" />
                                                    +{item.diff.toLocaleString()} {m.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 text-right font-mono font-bold">
                                            {isBalanced ? (
                                                <span className="text-gray-500">-</span>
                                            ) : (
                                                <span className={isShort ? 'text-red-400' : 'text-blue-400'}>
                                                    {isShort ? '-' : '+'}Rp {Math.abs(Math.round(item.costDiff)).toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5">
                                            <input
                                                type="text"
                                                placeholder="Keterangan..."
                                                value={itemsState[m.id]?.notes || ''}
                                                onChange={(e) => handleItemNoteChange(m.id, e.target.value)}
                                                className="w-full bg-[#0a0a0a] border border-[#222222] rounded px-2 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-purple-500"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Summary & Action Bar */}
                <div className="p-4 border-t border-[#222222] bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    {/* Summary KPI Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-[#161616] border border-[#262626] rounded-xl px-3 py-2 flex items-center space-x-2">
                            <span className="text-gray-400 text-[10px] uppercase font-bold">Bahan Selisih:</span>
                            <span className={`font-mono font-black text-sm ${itemsWithDifference > 0 ? 'text-yellow-400' : 'text-[#00ff66]'}`}>
                                {itemsWithDifference} / {totalItems}
                            </span>
                        </div>

                        <div className="bg-[#161616] border border-[#262626] rounded-xl px-3 py-2 flex items-center space-x-2">
                            <span className="text-gray-400 text-[10px] uppercase font-bold">Total Nilai Selisih:</span>
                            <span className={`font-mono font-black text-sm ${totalVarianceCost < 0 ? 'text-red-400' : totalVarianceCost > 0 ? 'text-blue-400' : 'text-[#00ff66]'}`}>
                                {totalVarianceCost < 0 ? '-' : totalVarianceCost > 0 ? '+' : ''}Rp {Math.abs(Math.round(totalVarianceCost)).toLocaleString()}
                            </span>
                        </div>

                        <label className="flex items-center space-x-2 cursor-pointer bg-[#161616] border border-[#262626] rounded-xl px-3 py-2">
                            <input
                                type="checkbox"
                                checked={applyAdjustment}
                                onChange={(e) => setApplyAdjustment(e.target.checked)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-0 bg-[#0a0a0a] border-[#333333]"
                            />
                            <span className="text-gray-300 font-bold text-[11px]">
                                Terapkan Penyesuaian ke Saldo Sistem
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-transparent border border-[#2a2a2a] text-gray-300 font-semibold hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                        >
                            {submitting ? (
                                <span>Menyimpan Opname...</span>
                            ) : (
                                <>
                                    <span>Simpan & Terapkan Opname</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

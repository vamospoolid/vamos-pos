import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Calculator, Info } from 'lucide-react';
import { api } from '../api';
import { vamosAlert } from '../utils/dialog';

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: any | null;
    onSuccess: () => void;
}

export default function RestockModal({ isOpen, onClose, material, onSuccess }: RestockModalProps) {
    const [purchaseQty, setPurchaseQty] = useState<number | string>('1');
    const [purchaseUnit, setPurchaseUnit] = useState<string>('');
    const [conversionRatio, setConversionRatio] = useState<number | string>('1');
    const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number | string>('');
    const [notes, setNotes] = useState<string>('');
    const [useMovingAverage, setUseMovingAverage] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (material) {
            setPurchaseUnit(material.purchaseUnit || `Pack (${material.unit})`);
            setConversionRatio(material.conversionRatio || 1);
            setPurchaseQty(1);
            setPurchasePricePerUnit(material.lastPurchasePrice || '');
            setNotes('');
            setUseMovingAverage(true);
        }
    }, [material, isOpen]);

    if (!isOpen || !material) return null;

    const numQty = Number(purchaseQty) || 0;
    const numRatio = Number(conversionRatio) || 1;
    const numPrice = Number(purchasePricePerUnit) || 0;

    const addedAtomicStock = numQty * numRatio;
    const incomingCostPerAtomic = numRatio > 0 && numPrice > 0 ? numPrice / numRatio : 0;
    const newStock = (material.currentStock || 0) + addedAtomicStock;

    // Moving average calculation preview
    let estimatedCostPerUnit = material.costPerUnit || 0;
    if (incomingCostPerAtomic > 0) {
        if (material.currentStock > 0 && useMovingAverage) {
            const oldVal = (material.currentStock || 0) * (material.costPerUnit || 0);
            const newVal = addedAtomicStock * incomingCostPerAtomic;
            estimatedCostPerUnit = newStock > 0 ? (oldVal + newVal) / newStock : incomingCostPerAtomic;
        } else {
            estimatedCostPerUnit = incomingCostPerAtomic;
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (numQty <= 0) {
            return vamosAlert('Jumlah pembelian (Qty) harus lebih dari 0');
        }

        try {
            setSubmitting(true);
            await api.post(`/inventory/raw-materials/${material.id}/restock`, {
                purchaseQty: numQty,
                purchasePricePerUnit: numPrice > 0 ? numPrice : undefined,
                notes: notes.trim() || undefined,
                useMovingAverage
            });

            vamosAlert(`✅ Berhasil restock ${material.name}! Stok bertambah +${addedAtomicStock.toLocaleString()} ${material.unit}.`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Restock error:', err);
            vamosAlert(err.response?.data?.error || 'Gagal memproses kulakan bahan baku');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-4 border-b border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00aaff]/15 border border-[#00aaff]/30 flex items-center justify-center text-[#00aaff]">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <span>Kulakan / Restock:</span>
                                <span className="text-[#00aaff]">{material.name}</span>
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Stok Saat Ini: <b className="text-white font-mono">{Number(material.currentStock).toLocaleString()} {material.unit}</b> | Modal: <b className="text-[#ff9900] font-mono">Rp {Number(material.costPerUnit).toLocaleString()}/{material.unit}</b>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                    {/* Packaging / Purchase Unit Information */}
                    <div className="bg-black/30 border border-[#222222] rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-[#00aaff]" />
                                Satuan Pembelian Faktur
                            </span>
                            <span className="text-[10px] text-gray-500">Contoh: Dus, Jerigen, Karung</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    Satuan Kemasan (Faktur)
                                </label>
                                <input
                                    type="text"
                                    value={purchaseUnit}
                                    onChange={(e) => setPurchaseUnit(e.target.value)}
                                    placeholder="Contoh: Dus 12L / Karung"
                                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00aaff]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    Isi per Kemasan ({material.unit})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={conversionRatio}
                                    onChange={(e) => setConversionRatio(e.target.value)}
                                    placeholder="Contoh: 12000"
                                    className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-[#00aaff]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity & Price per Unit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1.5">
                                Jumlah Beli ({purchaseUnit || 'Kemasan'}) *
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                step="any"
                                required
                                value={purchaseQty}
                                onChange={(e) => setPurchaseQty(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-3 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:border-[#00aaff]"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1.5">
                                Harga Beli per {purchaseUnit || 'Kemasan'} (Rp)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={purchasePricePerUnit}
                                onChange={(e) => setPurchasePricePerUnit(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-3 py-2.5 text-base font-bold font-mono text-[#ff9900] focus:outline-none focus:border-[#ff9900]"
                                placeholder="Rp 0"
                            />
                        </div>
                    </div>

                    {/* Notes / Invoice */}
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Catatan Kulakan / No. Faktur / Nama Toko
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Toko Barista Abadi #INV-290"
                            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00aaff]"
                        />
                    </div>

                    {/* Moving Average Costing Option */}
                    <div className="bg-[#191919] border border-[#292929] rounded-xl p-3 flex items-center justify-between">
                        <div className="pr-3">
                            <p className="font-bold text-gray-200">Gunakan Moving Average Costing</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Menggabungkan nilai sisa stok lama dengan harga beli baru secara tertimbang agar HPP akurat.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useMovingAverage}
                                onChange={(e) => setUseMovingAverage(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00aaff]"></div>
                        </label>
                    </div>

                    {/* Real-Time Live Calculation Card */}
                    <div className="bg-gradient-to-br from-[#0c1a24] to-[#0d161d] border border-[#00aaff]/30 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#00aaff]/20 pb-2">
                            <span className="font-bold text-xs text-[#00aaff] flex items-center gap-1.5">
                                <Calculator className="w-4 h-4" />
                                Ringkasan Otomatis Sistem
                            </span>
                            <span className="text-[10px] bg-[#00aaff]/20 text-[#00aaff] px-2 py-0.5 rounded-full font-mono font-bold">
                                Auto-Calculate
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <span className="text-gray-400 text-[10px] block">Stok Masuk:</span>
                                <span className="text-sm font-black font-mono text-[#00ff66]">
                                    +{addedAtomicStock.toLocaleString()} {material.unit}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-[10px] block">Harga Masuk per {material.unit}:</span>
                                <span className="text-sm font-black font-mono text-gray-200">
                                    Rp {incomingCostPerAtomic > 0 ? (Math.round(incomingCostPerAtomic * 100) / 100).toLocaleString() : '0'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-[10px] block">Estimasi Stok Akhir:</span>
                                <span className="text-sm font-bold font-mono text-white">
                                    {newStock.toLocaleString()} {material.unit}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-[10px] block">Estimasi Modal Baru:</span>
                                <span className="text-sm font-bold font-mono text-[#ff9900]">
                                    Rp {(Math.round(estimatedCostPerUnit * 100) / 100).toLocaleString()} / {material.unit}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-transparent border border-[#2a2a2a] text-gray-300 font-semibold hover:bg-white/5 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || numQty <= 0}
                            className="flex-1 py-3 rounded-xl bg-[#00aaff] hover:bg-[#0099ee] text-white font-bold disabled:opacity-50 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,170,255,0.3)] transition-all"
                        >
                            {submitting ? (
                                <span>Menyimpan...</span>
                            ) : (
                                <>
                                    <span>Terapkan Kulakan</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

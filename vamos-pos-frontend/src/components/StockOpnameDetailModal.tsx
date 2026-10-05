import { X, ClipboardCheck, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StockOpnameDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    opname: any | null;
}

export default function StockOpnameDetailModal({ isOpen, onClose, opname }: StockOpnameDetailModalProps) {
    if (!isOpen || !opname) return null;

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-[#222222] bg-[#0a0a0a] flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-white">Detail Stock Opname</h2>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                                    #{opname.opnameNumber}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Tanggal: {new Date(opname.date).toLocaleString('id-ID')} | Petugas: <b className="text-white">{opname.conductedBy || '-'}</b>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Stats */}
                <div className="p-4 bg-[#111111] border-b border-[#222222] grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                        <span className="text-gray-400 text-[10px] block uppercase font-bold">Total Item Diperiksa:</span>
                        <span className="text-base font-mono font-bold text-white">{opname.items?.length || 0} Bahan</span>
                    </div>
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                        <span className="text-gray-400 text-[10px] block uppercase font-bold">Status Opname:</span>
                        <span className="text-base font-bold text-[#00ff66]">{opname.status}</span>
                    </div>
                    <div className="bg-[#181818] p-3 rounded-xl border border-[#262626]">
                        <span className="text-gray-400 text-[10px] block uppercase font-bold">Total Nilai Selisih:</span>
                        <span className={`text-base font-mono font-black ${opname.totalVarianceCost < 0 ? 'text-red-400' : opname.totalVarianceCost > 0 ? 'text-blue-400' : 'text-[#00ff66]'}`}>
                            {opname.totalVarianceCost < 0 ? '-' : opname.totalVarianceCost > 0 ? '+' : ''}Rp {Math.abs(Math.round(opname.totalVarianceCost)).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#222222] text-[10px] uppercase tracking-wider text-gray-500 pb-2">
                                <th className="pb-3 font-semibold">Nama Bahan Baku</th>
                                <th className="pb-3 font-semibold text-center">Satuan</th>
                                <th className="pb-3 font-semibold text-right">Stok Sistem</th>
                                <th className="pb-3 font-semibold text-right">Stok Fisik</th>
                                <th className="pb-3 font-semibold text-center">Selisih</th>
                                <th className="pb-3 font-semibold text-right">Kerugian/Kelebihan (Rp)</th>
                                <th className="pb-3 font-semibold">Catatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e1e]">
                            {opname.items?.map((item: any) => {
                                const isShort = item.difference < 0;
                                const isBalanced = item.difference === 0;

                                return (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 font-bold text-white">{item.rawMaterial?.name}</td>
                                        <td className="py-3 text-center">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-[#222222] text-gray-400">
                                                {item.rawMaterial?.unit}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-mono text-gray-400">{item.systemStock?.toLocaleString()}</td>
                                        <td className="py-3 text-right font-mono font-bold text-white">{item.physicalStock?.toLocaleString()}</td>
                                        <td className="py-3 text-center font-mono">
                                            {isBalanced ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Pas
                                                </span>
                                            ) : isShort ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                                                    <TrendingDown className="w-3 h-3" />
                                                    {item.difference?.toLocaleString()} {item.rawMaterial?.unit}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full">
                                                    <TrendingUp className="w-3 h-3" />
                                                    +{item.difference?.toLocaleString()} {item.rawMaterial?.unit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right font-mono font-bold">
                                            {isBalanced ? (
                                                <span className="text-gray-500">-</span>
                                            ) : (
                                                <span className={isShort ? 'text-red-400' : 'text-blue-400'}>
                                                    {isShort ? '-' : '+'}Rp {Math.abs(Math.round(item.costDifference || 0)).toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-gray-400 italic text-[11px] max-w-xs truncate">{item.notes || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#222222] bg-[#0a0a0a] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { LogOut, X, Calculator, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { vamosAlert } from '../utils/dialog';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed: (summaryData: any) => void;
}

const DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000', type: 'bill' },
  { value: 50000, label: 'Rp 50.000', type: 'bill' },
  { value: 20000, label: 'Rp 20.000', type: 'bill' },
  { value: 10000, label: 'Rp 10.000', type: 'bill' },
  { value: 5000, label: 'Rp 5.000', type: 'bill' },
  { value: 2000, label: 'Rp 2.000', type: 'bill' },
  { value: 1000, label: 'Rp 1.000', type: 'bill' },
  { value: 500, label: 'Rp 500 (Koin)', type: 'coin' },
  { value: 200, label: 'Rp 200 (Koin)', type: 'coin' },
  { value: 100, label: 'Rp 100 (Koin)', type: 'coin' }
];

export default function ShiftHandoverModal({ isOpen, onClose, onShiftClosed }: ShiftHandoverModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Breakdown pecahan uang
  const [breakdown, setBreakdown] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0
  });

  const [useManualCash, setUseManualCash] = useState(false);
  const [manualCashInput, setManualCashInput] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');

  // Selesai tutup shift view
  const [closedResult, setClosedResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchActiveShiftSummary();
    } else {
      setClosedResult(null);
    }
  }, [isOpen]);

  const fetchActiveShiftSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shifts/active/summary');
      setSummary(res.data.data);
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal memuat ringkasan shift');
    } finally {
      setLoading(false);
    }
  };

  const handleDenomChange = (val: number, count: number) => {
    setBreakdown(prev => ({
      ...prev,
      [val]: Math.max(0, count || 0)
    }));
  };

  const calculatedTotalCash = Object.entries(breakdown).reduce((sum, [denom, count]) => {
    return sum + Number(denom) * (Number(count) || 0);
  }, 0);

  const finalActualCash = useManualCash ? manualCashInput : calculatedTotalCash;
  const expectedCash = summary?.expectedCash || 0;
  const difference = finalActualCash - expectedCash;

  const handleSubmitCloseShift = async () => {
    if (difference !== 0 && !differenceReason.trim()) {
      vamosAlert('Terjadi selisih kas! Harap isi alasan atau keterangan selisih kas.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/shifts/close', {
        endingCashActual: finalActualCash,
        notes,
        cashBreakdown: breakdown,
        differenceReason: difference !== 0 ? differenceReason : undefined
      });

      setClosedResult(res.data.data);
      onShiftClosed(res.data.data);
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal menutup shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintHandover = async () => {
    try {
      window.print();
    } catch (e) {
      vamosAlert('Gagal mencetak struk shift');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[70] p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] my-8">
        {/* Header */}
        <div className="p-6 border-b border-[#222222] bg-[#0c0c0c] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3333]/15 border border-[#ff3333]/30 flex items-center justify-center text-[#ff3333]">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                {closedResult ? 'STRUK SERAH TERIMA SHIFT' : 'TUTUP SHIFT & REKONSILIASI KAS'}
              </h2>
              <p className="text-xs text-gray-400">
                Kasir: <span className="font-bold text-gray-200">{summary?.cashierName || 'Kasir'}</span> ·{' '}
                Mulai: {summary?.startTime ? new Date(summary.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Memuat data transaksi shift...</div>
        ) : closedResult ? (
          /* Struk Hasil Tutup Shift */
          <div className="p-6 space-y-6">
            <div className="p-5 rounded-2xl border border-[#222222] bg-[#0a0a0a] space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-dashed border-[#333]">
                <p className="text-base font-black text-white">VAMOS POOL & CAFE</p>
                <p className="text-[10px] text-gray-500">LAPORAN TUTUP SHIFT KASIR</p>
                <p className="text-[10px] text-gray-400">{new Date(closedResult.endTime).toLocaleString('id-ID')}</p>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-400">Kasir:</span>
                <span className="font-bold text-white">{closedResult.cashierName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Durasi Kerja:</span>
                <span className="text-gray-200">{Math.floor(closedResult.durationMinutes / 60)}j {closedResult.durationMinutes % 60}m</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Modal Awal:</span>
                <span className="text-gray-200">Rp {closedResult.startingCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Penjualan Tunai (Cash):</span>
                <span className="text-[#00ff66] font-bold">+ Rp {closedResult.salesSummary.cashSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Penjualan QRIS:</span>
                <span className="text-[#00aaff]">Rp {closedResult.salesSummary.qrisSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Penjualan EDC/Card:</span>
                <span className="text-purple-400">Rp {closedResult.salesSummary.cardSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Pengeluaran Kasir (Expense):</span>
                <span className="text-[#ff3333] font-bold">- Rp {closedResult.expensesSummary.totalExpenseAmount.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-[#333] flex justify-between font-bold text-sm">
                <span className="text-gray-300">Target Kas Laci:</span>
                <span className="text-[#ff9900]">Rp {closedResult.expectedCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span className="text-gray-300">Fisik Dihitung:</span>
                <span className="text-white">Rp {closedResult.endingCashActual.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1">
                <span>Status Selisih:</span>
                <span className={closedResult.cashDifference === 0 ? 'text-[#00ff66]' : closedResult.cashDifference > 0 ? 'text-yellow-400' : 'text-[#ff3333]'}>
                  {closedResult.cashDifference === 0 ? 'BALANCE (PAS)' : closedResult.cashDifference > 0 ? `LEBIH (+Rp ${closedResult.cashDifference.toLocaleString()})` : `KURANG (-Rp ${Math.abs(closedResult.cashDifference).toLocaleString()})`}
                </span>
              </div>
              {closedResult.differenceReason && (
                <p className="text-[10px] text-gray-400 italic pt-1">Alasan: {closedResult.differenceReason}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrintHandover}
                className="flex-1 py-3.5 rounded-2xl bg-[#00ff66] text-[#0a0a0a] font-black flex items-center justify-center gap-2 hover:bg-[#00e65c] transition-all"
              >
                <Printer className="w-4 h-4" /> Cetak Struk Tutup Shift
              </button>
              <button
                onClick={onClose}
                className="py-3.5 px-6 rounded-2xl bg-[#222222] text-white font-bold hover:bg-[#333333] transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          /* Form Hitung Kas Fisik */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Ringkasan Keuangan Sistem */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Modal Awal</p>
                <p className="text-sm font-black font-mono text-white mt-0.5">
                  Rp {(summary?.startingCash || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Penjualan Cash</p>
                <p className="text-sm font-black font-mono text-[#00ff66] mt-0.5">
                  + Rp {(summary?.salesSummary?.cashSales || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pengeluaran Laci</p>
                <p className="text-sm font-black font-mono text-[#ff3333] mt-0.5">
                  - Rp {(summary?.expensesSummary?.totalExpenseAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#00ff66]/10 border border-[#00ff66]/30">
                <p className="text-[10px] uppercase font-black text-[#00ff66] tracking-wider">Harus Ada di Laci</p>
                <p className="text-sm font-black font-mono text-[#00ff66] mt-0.5">
                  Rp {expectedCash.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Non-Cash Info */}
            <div className="flex gap-4 p-3 rounded-2xl bg-[#0d0d0d] border border-[#1e1e1e] text-xs text-gray-400">
              <span>💳 Non-Tunai QRIS: <b className="text-white">Rp {(summary?.salesSummary?.qrisSales || 0).toLocaleString()}</b></span>
              <span>·</span>
              <span>💳 EDC/Card: <b className="text-white">Rp {(summary?.salesSummary?.cardSales || 0).toLocaleString()}</b></span>
              <span>·</span>
              <span>Transaksi: <b className="text-white">{summary?.salesSummary?.transactionCount || 0} order</b></span>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#ff9900]" />
                Hitung Pecahan Uang Fisik di Laci:
              </span>
              <button
                onClick={() => setUseManualCash(!useManualCash)}
                className="text-[11px] font-bold text-gray-400 hover:text-white underline"
              >
                {useManualCash ? 'Gunakan Hitung Pecahan' : 'Input Total Langsung'}
              </button>
            </div>

            {useManualCash ? (
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] space-y-2">
                <label className="text-xs font-bold text-gray-300">Total Nominal Uang Fisik (Rp):</label>
                <input
                  type="number"
                  value={manualCashInput || ''}
                  onChange={e => setManualCashInput(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-[#141414] border border-[#333333] rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-[#ff9900]"
                />
              </div>
            ) : (
              /* Grid Pecahan Lembaran & Koin */
              <div className="grid grid-cols-2 gap-2.5">
                {DENOMINATIONS.map(d => {
                  const count = breakdown[d.value] || 0;
                  const subtotal = d.value * count;
                  return (
                    <div key={d.value} className="p-2.5 rounded-xl bg-[#0a0a0a] border border-[#1e1e1e] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-200 block">{d.label}</span>
                        <span className="text-[10px] text-gray-500 font-mono">Rp {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={count === 0 ? '' : count}
                          onChange={e => handleDenomChange(d.value, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 bg-[#161616] border border-[#2a2a2a] rounded-lg py-1 px-2 text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-[#ff9900]"
                        />
                        <span className="text-[10px] text-gray-500">{d.type === 'bill' ? 'lbr' : 'koin'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Fisik vs Ekspektasi & Selisih Indicator */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              difference === 0
                ? 'bg-[#00ff66]/10 border-[#00ff66]/30'
                : difference > 0
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-[#ff3333]/10 border-[#ff3333]/30'
            }`}>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Uang Fisik Terhitung</p>
                <p className="text-xl font-black font-mono text-white mt-0.5">
                  Rp {finalActualCash.toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {difference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${difference > 0 ? 'text-yellow-400' : 'text-[#ff3333]'}`} />
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {difference === 0 ? 'BALANCE (PAS)' : difference > 0 ? 'KAS LEBIH (OVER)' : 'KAS KURANG (SHORT)'}
                  </span>
                </div>
                <p className={`text-base font-black font-mono mt-0.5 ${
                  difference === 0 ? 'text-[#00ff66]' : difference > 0 ? 'text-yellow-400' : 'text-[#ff3333]'
                }`}>
                  {difference === 0 ? 'Rp 0' : (difference > 0 ? `+Rp ${difference.toLocaleString()}` : `-Rp ${Math.abs(difference).toLocaleString()}`)}
                </p>
              </div>
            </div>

            {/* Field Alasan jika ada selisih */}
            {difference !== 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Alasan / Keterangan Selisih Kas (Wajib diisi):
                </label>
                <input
                  type="text"
                  value={differenceReason}
                  onChange={e => setDifferenceReason(e.target.value)}
                  placeholder="Contoh: Salah kembalian transaksi meja 3 / tip kasir..."
                  className="w-full bg-[#0a0a0a] border border-yellow-500/40 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            )}

            {/* Catatan Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400">Catatan Serah Terima (Opsional):</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan untuk kasir shift selanjutnya..."
                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff9900]"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl bg-transparent border border-[#262626] text-gray-300 font-bold hover:bg-white/5 transition-all text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitCloseShift}
                disabled={submitting}
                className="flex-[2] py-3.5 rounded-2xl bg-[#ff3333] text-white font-black hover:bg-[#e62e2e] shadow-[0_0_20px_rgba(255,51,51,0.25)] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {submitting ? 'Menyimpan...' : 'Konfirmasi Tutup Shift'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

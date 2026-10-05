import { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { api } from '../api';
import { vamosAlert } from '../utils/dialog';

interface WasteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rawMaterials: any[];
}

export default function WasteLogModal({ isOpen, onClose, onSuccess, rawMaterials }: WasteLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [rawMaterialId, setRawMaterialId] = useState(rawMaterials[0]?.id || '');
  const [quantity, setQuantity] = useState<number | string>('');
  const [reason, setReason] = useState('EXPIRED');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedMaterial = rawMaterials.find(r => r.id === rawMaterialId) || rawMaterials[0];
  const qtyNumber = Number(quantity) || 0;
  const estimatedCostLoss = selectedMaterial ? qtyNumber * selectedMaterial.costPerUnit : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawMaterialId || !qtyNumber || qtyNumber <= 0) {
      vamosAlert('Pilih bahan baku dan masukkan jumlah bahan yang rusak!');
      return;
    }

    if (selectedMaterial && selectedMaterial.currentStock < qtyNumber) {
      vamosAlert(`Stok saat ini (${selectedMaterial.currentStock} ${selectedMaterial.unit}) lebih kecil dari jumlah yang ingin dicatat rusak (${qtyNumber} ${selectedMaterial.unit})`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/inventory/waste', {
        rawMaterialId,
        quantity: qtyNumber,
        reason,
        notes
      });
      vamosAlert('Pencatatan bahan rusak/basi berhasil disimpan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      vamosAlert(err.response?.data?.error || err.response?.data?.message || 'Gagal menyimpan pencatatan waste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#222222] bg-[#0c0c0c] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff3333]/15 border border-[#ff3333]/30 flex items-center justify-center text-[#ff3333]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                CATAT BAHAN RUSAK / BASI
              </h2>
              <p className="text-xs text-gray-400">
                Dokumentasi Spoilage, Basi & Pengurangan Stok
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Bahan Baku</label>
            <select
              value={rawMaterialId}
              onChange={e => setRawMaterialId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff3333]"
            >
              {rawMaterials.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} (Sisa: {r.currentStock} {r.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Jumlah ({selectedMaterial?.unit || 'Unit'})
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Contoh: 250"
                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-[#ff3333]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Alasan Kerusakan</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff3333]"
              >
                <option value="EXPIRED">Kedaluwarsa (Expired)</option>
                <option value="SPOILED">Basi / Bau / Rusak</option>
                <option value="SPILL">Tumpah / Pecah</option>
                <option value="DAMAGED">Kemasan Bocor/Cacat</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Estimasi Kerugian Biaya */}
          <div className="p-3.5 rounded-2xl bg-[#ff3333]/10 border border-[#ff3333]/20 flex justify-between items-center text-xs">
            <span className="text-gray-300 font-medium">Estimasi Kerugian (Cost Loss):</span>
            <span className="font-mono font-black text-[#ff5555] text-sm">
              Rp {Math.round(estimatedCostLoss).toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan / Detail Kejadian</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Susu basi karena kulkas sempat mati semalam..."
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#222222] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff3333]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-transparent border border-[#262626] text-gray-300 font-bold hover:bg-white/5 transition-all text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 rounded-2xl bg-[#ff3333] text-white font-black hover:bg-[#e62e2e] shadow-[0_0_20px_rgba(255,51,51,0.25)] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Pencatatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

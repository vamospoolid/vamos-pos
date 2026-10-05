import { useState } from 'react';
import { Sparkles, X, CheckCircle2, Coffee, UtensilsCrossed, Layers } from 'lucide-react';
import { api } from '../api';
import { vamosAlert } from '../utils/dialog';

interface StarterPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StarterPackModal({ isOpen, onClose, onSuccess }: StarterPackModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    try {
      setLoading(true);
      const res = await api.post('/inventory/starter-pack');
      vamosAlert(res.data.message || 'Starter pack berhasil diimpor!');
      onSuccess();
      onClose();
    } catch (err: any) {
      vamosAlert(err.response?.data?.message || 'Gagal mengimpor starter pack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[70] p-4">
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl w-full max-w-xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-[#222222] bg-[#0c0c0c] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00ff66]/20 to-[#00aaff]/20 border border-[#00ff66]/30 flex items-center justify-center text-[#00ff66]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                STARTER PACK BILIAR & CAFE
              </h2>
              <p className="text-xs text-gray-400">
                Setup 1-Klik Bahan Baku, Resep Otomatis & Standar HPP
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00ff66]/10 to-[#00aaff]/10 border border-[#00ff66]/20 text-xs text-gray-300 space-y-1">
            <p className="font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
              Apa yang akan disiapkan otomatis oleh sistem?
            </p>
            <p className="text-gray-400 leading-relaxed">
              Sistem akan memasukkan daftar master bahan baku standar, resep menu favorit kafe biliar, takaran per porsi, dan mengaktifkan sistem HPP otomatis di venue Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Box Minuman */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] space-y-2">
              <div className="flex items-center gap-2 text-[#00aaff] font-bold">
                <Coffee className="w-4 h-4" />
                <span>Minuman (Beverages)</span>
              </div>
              <ul className="text-gray-400 space-y-1 pl-1">
                <li>• Biji Kopi Espresso Blend (Gram)</li>
                <li>• Susu UHT Full Cream (ml)</li>
                <li>• Gula Aren Cair Organik (ml)</li>
                <li>• Sirup Hazelnut & Vanilla (ml)</li>
                <li>• Bubuk Cokelat & Matcha (Gram)</li>
                <li>• Teh Hitam & Lemon Concentrate</li>
                <li>• Es Batu Kristal & Cup 16oz</li>
              </ul>
              <p className="text-[10px] text-gray-500 italic pt-1 border-t border-[#1e1e1e]">
                Resep siap pakai: Kopi Susu Aren, Americano, Iced Cokelat, Lemon Tea
              </p>
            </div>

            {/* Box Makanan */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] space-y-2">
              <div className="flex items-center gap-2 text-[#ff9900] font-bold">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Makanan & Snacks</span>
              </div>
              <ul className="text-gray-400 space-y-1 pl-1">
                <li>• French Fries Beku Shoestring</li>
                <li>• Sosis Sapi Jumbo Bratwurst</li>
                <li>• Indomie Goreng & Kuah (Pack)</li>
                <li>• Telur Ayam & Kornet Sapi</li>
                <li>• Cireng Salju Beku & Nugget</li>
                <li>• Keju, Mayones, Saus Sambal</li>
                <li>• Paper Bowl Snack Box & Sedotan</li>
              </ul>
              <p className="text-[10px] text-gray-500 italic pt-1 border-t border-[#1e1e1e]">
                Resep siap pakai: French Fries, Sosis BBQ, Indomie Internet, Cireng
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111111] border border-[#222222] flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Total Master Item:
            </span>
            <span className="font-mono font-bold text-white">25+ Bahan Baku · 8 Resep Siap Pakai</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#0a0a0a] border-t border-[#222222] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-transparent border border-[#262626] text-gray-300 font-bold hover:bg-white/5 transition-all text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-[#00ff66] to-[#00cc52] text-[#0a0a0a] font-black hover:opacity-95 shadow-[0_0_20px_rgba(0,255,102,0.25)] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Mengimpor Data...' : 'Mulai Import Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}

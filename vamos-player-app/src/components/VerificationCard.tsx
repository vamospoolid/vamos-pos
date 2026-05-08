import { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { api, getAvatarUrl } from '../api';
import { useAppStore } from '../store/appStore';

export function VerificationCard({ member, venueInfo }: { member: any, venueInfo: any }) {
  const { refreshMemberData, addToast } = useAppStore();
  const [uploading, setUploading] = useState(false);

  const handleVerifyWa = () => {
    api.post(`/player/${member.id}/notify-verify`).catch(() => {});
    const adminPhone = venueInfo?.phone || "6281244047610";
    const waText = venueInfo?.waVerificationText || "Halo Vamos Pool, saya ingin verifikasi akun member saya dengan ID:";
    window.open(`https://wa.me/${adminPhone.replace(/\+/g, '')}?text=${encodeURIComponent(waText)}%20${member.id}`, '_blank');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await api.post(`/player/${member.id}/avatar`, formData);
      if (res.data.success) {
        refreshMemberData();
        addToast({ title: 'SYNC COMPLETE', message: 'Foto profil berhasil diunggah.', type: 'success' });
      }
    } catch (err: any) { 
        addToast({ title: 'UPLOAD FAILED', message: err.response?.data?.message || 'Gagal mengunggah foto.', type: 'error' });
    } finally { 
        setUploading(false); 
    }
  };

  return (
    <div className="fiery-card p-10 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic">Security Protocol</p>
          <h3 className="text-2xl font-black text-white uppercase italic">PROFIL MEMBER</h3>
        </div>
      </div>
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.isWaVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-slate-700 border-white/5'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic">WhatsApp Protocol</p>
            </div>
          </div>
          {member.isWaVerified ? (
            <div className="px-5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase italic border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">VERIFIED</div>
          ) : (
            <button onClick={handleVerifyWa} className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic border border-primary/20">Verify</button>
          )}
        </div>
        <div className="flex items-center justify-between p-5 rounded-[28px] bg-[#101423] border border-white/5">
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center border ${member.photo ? 'bg-primary/10 text-primary' : 'text-slate-700'}`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase italic">Foto Profil</p>
            </div>
          </div>
          {getAvatarUrl(member.photo) ? (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-primary/30">
                <img src={getAvatarUrl(member.photo)!} alt="" className="w-full h-full object-cover" />
              </div>
              <label className="text-[9px] font-black text-primary cursor-pointer border-b border-primary/30 pb-0.5">
                REPLACE
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          ) : (
            <label className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase italic cursor-pointer">
              {uploading ? 'SYNC' : 'UPLOAD'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

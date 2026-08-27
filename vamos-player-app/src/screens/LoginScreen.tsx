import { useState } from 'react';
import { Loader2, Download, Smartphone, Sparkles } from 'lucide-react';
import { api } from '../api';
import { VamosLogo } from '../components/VamosLogo';
import { useAppStore } from '../store/appStore';

export function LoginScreen({ onLogin }: { onLogin: (member: any) => void }) {
  const { addToast } = useAppStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deviceId = localStorage.getItem('playerDeviceId');
      const endpoint = isRegister ? '/player/register' : '/player/login';
      const payload = isRegister ? { phone, name, password, deviceId } : { phone, password, deviceId };
      const res = await api.post(endpoint, payload);

      if (res.data.success) {
        localStorage.setItem('playerToken', res.data.data.token);
        onLogin(res.data.data.member);
        addToast({ title: 'LOGIN BERHASIL', message: isRegister ? 'Akun berhasil dibuat.' : 'Selamat datang kembali!', type: 'success' });
      } else {
        addToast({ title: 'LOGIN GAGAL', message: res.data.message || 'Gagal login.', type: 'error' });
      }
    } catch (err: any) {
      addToast({ title: 'SISTEM ERROR', message: err.response?.data?.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#070b14] relative overflow-hidden text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] bg-cyan-500/12 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/12 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[200px] h-[200px] bg-blue-600/8 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="bg-[#0d1628]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] w-full max-w-sm relative z-10 fade-in border border-cyan-500/20 shadow-[0_0_60px_rgba(6,182,212,0.12)]">
        
        {/* Header & Logo */}
        <div className="text-center mb-7">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)] relative group">
            <div className="absolute inset-0 rounded-3xl bg-cyan-400/5 animate-pulse" />
            <VamosLogo className="w-12 h-12 text-cyan-400" glowing />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] italic">Player Portal</p>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
            VAMOS<span className="text-cyan-400 ml-1.5 underline decoration-cyan-500/50 decoration-2 underline-offset-4">ARENA</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2.5">
            {isRegister ? 'Daftar & raih poin loyalty member' : 'Selamat datang kembali, Player'}
          </p>
        </div>

        {/* Tab Switcher (Login / Daftar) */}
        <div className="flex bg-[#09101f] p-1.5 rounded-2xl mb-7 border border-cyan-500/15">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all italic ${
              !isRegister 
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all italic ${
              isRegister 
                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {isRegister && (
            <div className="fade-in space-y-1.5">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Tampilan / Alias</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Arif Vamos, Akil 55"
                className="w-full bg-[#09101f] border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 text-white font-medium placeholder:text-slate-600 transition-all text-xs"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nomor WhatsApp</label>
            <div className="flex gap-2">
              <div className="bg-[#09101f] border border-white/10 rounded-2xl px-3.5 py-3.5 text-cyan-400 font-black text-xs flex items-center shrink-0">
                +62
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="812 3456 7890"
                className="flex-1 w-full bg-[#09101f] border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 text-white font-medium placeholder:text-slate-600 transition-all text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">PIN / Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#09101f] border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 text-white font-medium placeholder:text-slate-600 transition-all text-xs"
            />
            {!isRegister && (
               <p className="text-[8px] text-slate-500 px-1 italic font-medium leading-relaxed mt-1">
                 Jika pertama kali login, ketik sandi baru yang akan otomatis menjadi sandi akun Anda.
               </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] text-black italic transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-5 shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
            ) : (
              <span>{isRegister ? 'Buat Akun Member' : 'Masuk ke Arena'}</span>
            )}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-500 font-bold uppercase mt-6 tracking-widest">
          {isRegister ? 'Dengan bergabung Anda menyetujui aturan arena' : 'Kendala login? Hubungi Kasir.'}
        </p>
        
        {/* ─── Download App Android Banner ─── */}
        <a
          href="/VamosPlayer.apk"
          download="VamosPlayer.apk"
          className="mt-5 w-full flex items-center gap-3.5 px-4 py-3.5 bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-transparent border border-cyan-500/30 rounded-2xl active:scale-95 transition-all hover:border-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] group"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-black italic uppercase text-[11px] text-white truncate">Download App Android</span>
              <span className="text-[7px] font-black bg-cyan-500 text-black px-1 py-0.2 rounded uppercase shrink-0">v5</span>
            </div>
            <span className="text-[8px] font-bold text-slate-400">12.4 MB · Versi Terbaru</span>
          </div>
          <Download className="w-4 h-4 text-cyan-400/80 group-hover:text-cyan-300 transition-all shrink-0" />
        </a>
      </div>
    </div>
  );
}

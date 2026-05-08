import { useState } from 'react';
import { Loader2, Download } from 'lucide-react';
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
        addToast({ title: 'LOGIN SUCCESS', message: isRegister ? 'Akun berhasil dibuat.' : 'Selamat datang!', type: 'success' });
      } else {
        addToast({ title: 'LOGIN FAILED', message: res.data.message || 'Gagal login.', type: 'error' });
      }
    } catch (err: any) {
      addToast({ title: 'SYSTEM ERROR', message: err.response?.data?.message || 'Terjadi kesalahan sistem.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[250px] h-[250px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm relative z-10 fade-in border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_50px_rgba(255,87,34,0.3)]">
            <VamosLogo className="w-12 h-12" glowing />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">ARENA<span className="text-accent underline decoration-primary decoration-4 underline-offset-4 ml-1">FIGHT</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-3">{isRegister ? 'Bergabung dengan liga juara' : 'Selamat datang kembali, legenda'}</p>
        </div>

        <div className="flex bg-surface-highlight/40 p-1.5 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isRegister ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-white'}`}
          >
            Daftar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <div className="fade-in">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Tampilan</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="NEXUS"
                className="w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Akses WhatsApp</label>
            <div className="flex gap-2">
              <div className="bg-surface-highlight/30 border border-white/10 rounded-xl px-4 py-4 text-slate-400 font-bold text-xs flex items-center">+62</div>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="812 3456 7890"
                className="flex-1 w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>

          <div className="fade-in mt-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">PIN Keamanan / Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-highlight/30 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-primary text-white font-medium placeholder:text-slate-600 transition-colors"
            />
            {!isRegister && (
               <p className="text-[9px] text-slate-500 mt-2 px-2 italic font-bold">Jika ini Login pertama, ketik Sandi Baru yang akan langsung menjadi Sandi permanen Akun Anda.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full fiery-btn-primary py-4 flex items-center justify-center active:scale-95 transition-all mt-6 text-sm uppercase tracking-widest font-black italic"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Buat Profil' : 'Masuk Arena')}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase mt-8 tracking-widest">
          {isRegister ? 'Dengan bergabung Anda menyetujui aturan arena' : 'Kendala login? Hubungi Kasir.'}
        </p>
        
        <a 
          href="/VamosPlayer.apk" 
          download="VamosPlayer_Latest.apk"
          className="mt-6 flex flex-col items-center justify-center py-4 bg-primary/10 border-2 border-primary/20 rounded-2xl mx-auto w-full max-w-[250px] shadow-[0_0_15px_rgba(255,87,34,0.1)] active:scale-95 transition-all text-primary hover:bg-primary/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-5 h-5" />
            <span className="font-black italic uppercase text-xs">Download App Android</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400">Lebih cepat. Lebih stabil.</span>
        </a>
      </div>
    </div>
  );
}

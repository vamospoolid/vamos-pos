import React, { useEffect, useState } from 'react';
import { VamosLogo } from './VamosLogo';

interface SplashScreenProps {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  logoUrl,
  title = "ARENA FIGHT",
  subtitle = "TANGKAS • TANDING • TAKLUKKAN",
  onComplete,
  duration = 2500,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800); // Duration of the exit fade
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070b14] transition-opacity duration-700 overflow-hidden ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Cinematic Glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-[circle_at_center,_var(--color-primary)_0%,_transparent_60%] opacity-10 animate-splash-bg" />
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] opacity-20" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Flexible Logo Container */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full scale-110 opacity-50 animate-pulse" />
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-32 h-32 object-contain relative z-10 animate-splash-logo" 
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center relative z-10 animate-splash-logo">
              <VamosLogo className="w-full h-full" glowing />
            </div>
          )}
        </div>

        {/* Branding Text */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-6 drop-shadow-[0_0_20px_rgba(255,87,34,0.5)]">
            {title.split(' ').map((word, i) => (
              <span key={i} className={i === 1 ? "text-primary ml-2" : ""}>
                 {word}
              </span>
            ))}
          </h1>
          
          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-50" />
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic animate-tagline whitespace-nowrap">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Loading Bar Simulator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48">
          <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-primary shadow-[0_0_10px_#ff5722] transition-all duration-[2500ms] ease-out" 
               style={{ width: isExiting ? '100%' : '20%' }}
             />
          </div>
          <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest mt-3 text-center opacity-50">Menginisialisasi Protokol Arena...</p>
      </div>

      {/* Decorative Corner Lines */}
      <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-primary/20 m-12 rounded-tl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-primary/20 m-12 rounded-br-3xl" />
    </div>
  );
};

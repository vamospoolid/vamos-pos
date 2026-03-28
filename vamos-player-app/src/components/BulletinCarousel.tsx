import { useState, useEffect } from 'react';
import { api } from '../api';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export function BulletinCarousel() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/announcements/active');
        if (res.data.success) {
          setAnnouncements(res.data.data);
        }
      } catch (err) {}
    };
    fetch();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];

  return (
    <div className="relative w-full h-48 sm:h-64 rounded-[32px] overflow-hidden group mb-8">
      {/* Background Image / Gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105 group-hover:scale-100"
        style={{ 
          backgroundImage: current.imageUrl ? `url(${current.imageUrl})` : 'none',
          backgroundColor: '#1a1f35'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d18] via-[#0a0d18]/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
            <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 flex items-center gap-1">
                <Zap size={10} className="text-primary fill-primary" />
                <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">FLASH NEWS</span>
            </div>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Priority {current.priority}</span>
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2 drop-shadow-lg">
          {current.title}
        </h2>
        <p className="text-xs text-white/70 font-medium line-clamp-2 max-w-md drop-shadow-md">
          {current.content}
        </p>

        {/* Indicators */}
        <div className="flex gap-1.5 mt-4">
          {announcements.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Controls (Desktop/Hover) */}
      {announcements.length > 1 && (
        <>
            <button 
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20"
            >
                <ChevronLeft size={20} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % announcements.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20"
            >
                <ChevronRight size={20} />
            </button>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Bell, Flame, Trophy, Zap } from 'lucide-react';
import { getSocket } from '../api';

interface NewsItem {
  id: string;
  type: string;
  message: string;
  timestamp: number;
}

export function LiveTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNews = (data: any) => {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: data.type,
        message: data.message,
        timestamp: Date.now()
      };
      
      setNews(prev => {
          const updated = [newItem, ...prev];
          return updated.slice(0, 5); // Keep last 5
      });
    };

    socket.on('arena:news', handleNews);
    
    // Auto-rotation timer
    const interval = setInterval(() => {
        setNews(prev => {
            if (prev.length > 1) {
                setCurrentIndex(curr => (curr + 1) % prev.length);
            }
            return prev;
        });
    }, 5000);

    return () => {
      socket.off('arena:news', handleNews);
      clearInterval(interval);
    };
  }, []);

  if (news.length === 0) return null;

  const current = news[currentIndex];

  const getIcon = (type: string) => {
    switch(type) {
      case 'KING_ASCENDED': return <Trophy className="text-amber-400" size={12} />;
      case 'KING_DETHRONED': return <Zap className="text-primary" size={12} />;
      case 'KING_STREAK': return <Flame className="text-orange-500" size={12} />;
      case 'LEVEL_UP': return <Radio className="text-cyan-400 animate-pulse" size={12} />;
      default: return <Bell className="text-white" size={12} />;
    }
  };

  return (
    <div className="mx-2 mb-6">
        <div className="bg-black/40 border border-white/5 rounded-2xl py-2.5 px-4 flex items-center gap-3 overflow-hidden h-10 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Live Arena</span>
            </div>
            
            <div className="flex-1 relative h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="absolute inset-0 flex items-center gap-2"
                    >
                        {getIcon(current.type)}
                        <span className="text-[9px] font-black text-white uppercase italic tracking-tight truncate">
                            {current.message}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
}

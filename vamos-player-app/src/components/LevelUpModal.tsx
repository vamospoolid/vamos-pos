import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ChevronRight } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#070b14]/95 backdrop-blur-xl"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-sm fiery-card p-10 border-2 border-primary/30 text-center overflow-hidden"
        >
          {/* Confetti / Aura Background */}
          <div className="absolute inset-0 champion-aura opacity-50" />
          
          <div className="relative z-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(251,191,36,0.4)]"
            >
              <Trophy size={48} className="text-white" strokeWidth={2.5} />
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-[12px] font-black text-primary uppercase tracking-[0.4em] mb-2 italic"
            >
              Promoted Sequence
            </motion.p>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-black text-white italic uppercase tracking-tighter mb-6"
            >
              LEVEL <span className="text-primary">{level}</span>
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10"
            >
               <div className="flex items-center justify-center gap-4 mb-3">
                  <Star className="text-yellow-400" fill="currentColor" size={16} />
                  <p className="text-[10px] font-black text-slate-300 uppercase italic">New Rank Rewards Unlocked</p>
                  <Star className="text-yellow-400" fill="currentColor" size={16} />
               </div>
               <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-relaxed italic">
                 Your combat proficiency has increased.<br/>Higher stake matches are now available.
               </p>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={onClose}
              className="w-full fiery-btn-primary py-5 flex items-center justify-center gap-3 group"
            >
              <span className="text-xs font-black italic tracking-widest">CONTINUE PROTOCOL</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React from 'react';

interface DominoTileProps {
  top?: number; // 0 to 6
  bottom?: number; // 0 to 6
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isFlipped?: boolean;
  isShuffling?: boolean;
  className?: string;
  horizontal?: boolean;
  glow?: boolean;
}

export const DominoTile: React.FC<DominoTileProps> = ({
  top = 6,
  bottom = 6,
  size = 'md',
  isFlipped = false,
  isShuffling = false,
  className = '',
  horizontal = false,
  glow = false,
}) => {
  // Dimensions based on size
  const sizeClasses = {
    xs: horizontal ? 'w-10 h-5 p-0.5 rounded-sm' : 'w-5 h-10 p-0.5 rounded-sm',
    sm: horizontal ? 'w-16 h-8 p-1 rounded-md' : 'w-8 h-16 p-1 rounded-md',
    md: horizontal ? 'w-24 h-12 p-1.5 rounded-lg' : 'w-12 h-24 p-1.5 rounded-lg',
    lg: horizontal ? 'w-32 h-16 p-2 rounded-xl' : 'w-16 h-32 p-2 rounded-xl',
    xl: horizontal ? 'w-44 h-22 p-2.5 rounded-2xl' : 'w-22 h-44 p-2.5 rounded-2xl',
  }[size];

  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3.5 h-3.5',
  }[size];

  // Render dots for 0-6
  const renderDots = (count: number) => {
    // 3x3 grid positions: [row, col] (0-2)
    // 0: none
    // 1: center
    // 2: top-left, bottom-right
    // 3: top-left, center, bottom-right
    // 4: 4 corners
    // 5: 4 corners + center
    // 6: 2 columns of 3
    const activePositions: boolean[] = Array(9).fill(false);

    if (count === 1) {
      activePositions[4] = true;
    } else if (count === 2) {
      activePositions[0] = true;
      activePositions[8] = true;
    } else if (count === 3) {
      activePositions[0] = true;
      activePositions[4] = true;
      activePositions[8] = true;
    } else if (count === 4) {
      activePositions[0] = true;
      activePositions[2] = true;
      activePositions[6] = true;
      activePositions[8] = true;
    } else if (count === 5) {
      activePositions[0] = true;
      activePositions[2] = true;
      activePositions[4] = true;
      activePositions[6] = true;
      activePositions[8] = true;
    } else if (count === 6) {
      activePositions[0] = true;
      activePositions[2] = true;
      activePositions[3] = true;
      activePositions[5] = true;
      activePositions[6] = true;
      activePositions[8] = true;
    }

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 place-items-center">
        {activePositions.map((isActive, idx) => (
          <div key={idx} className="w-full h-full flex items-center justify-center">
            {isActive && (
              <span
                className={`${dotSize} rounded-full bg-[#1e293b] shadow-inner transition-transform`}
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isFlipped) {
    return (
      <div
        className={`relative flex items-center justify-center select-none bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-cyan-500/30 shadow-xl ${sizeClasses} ${className} ${
          glow ? 'shadow-[0_0_20px_rgba(6,182,212,0.4)] border-cyan-400' : ''
        }`}
      >
        <div className="w-full h-full rounded border border-white/10 flex items-center justify-center bg-radial from-cyan-950/20 to-transparent">
          <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase opacity-75">
            VAMOS
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative select-none transition-all duration-300 flex ${
        horizontal ? 'flex-row' : 'flex-col'
      } bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] border border-slate-300 shadow-xl ${sizeClasses} ${className} ${
        isShuffling ? 'animate-pulse scale-95 ring-2 ring-red-500' : ''
      } ${glow ? 'shadow-[0_0_25px_rgba(239,68,68,0.5)] border-red-400 ring-2 ring-red-500/40' : ''}`}
      style={{
        boxShadow: glow
          ? '0 10px 25px -5px rgba(239, 68, 68, 0.4), inset 0 2px 2px rgba(255,255,255,0.9), inset 0 -2px 3px rgba(0,0,0,0.2)'
          : '0 8px 16px -2px rgba(0,0,0,0.4), inset 0 2px 2px rgba(255,255,255,0.9), inset 0 -2px 3px rgba(0,0,0,0.2)',
      }}
    >
      {/* Top half / Left half */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {renderDots(Math.min(6, Math.max(0, top)))}
      </div>

      {/* Divider line with center brass pin */}
      <div
        className={`relative flex items-center justify-center ${
          horizontal ? 'w-0.5 h-full bg-slate-400 my-auto' : 'w-full h-0.5 bg-slate-400 mx-auto'
        }`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-amber-500 border border-amber-600 shadow-sm shrink-0 absolute"
          style={{
            boxShadow: '0 0.5px 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      {/* Bottom half / Right half */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {renderDots(Math.min(6, Math.max(0, bottom)))}
      </div>
    </div>
  );
};

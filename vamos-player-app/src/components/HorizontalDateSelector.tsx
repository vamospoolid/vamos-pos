import { useMemo } from 'react';

interface HorizontalDateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function HorizontalDateSelector({ selectedDate, onDateChange }: HorizontalDateSelectorProps) {
  const dates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  return (
    <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 hide-scrollbar -mx-1 px-1 fade-in">
      {dates.map((date, i) => {
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNumber = date.getDate();

        return (
          <button
            key={i}
            onClick={() => onDateChange(date)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-[52px] py-4 rounded-[18px] transition-all duration-300 ${
              isSelected 
                ? 'bg-primary text-white shadow-[0_8px_20px_rgba(255,87,34,0.3)] scale-110' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`text-[8px] font-black uppercase tracking-widest mb-1.5 ${isSelected ? 'text-white/80' : 'text-slate-600'}`}>
              {dayName}
            </span>
            <span className={`text-base font-black italic italic leading-none`}>
              {dayNumber}
            </span>
            <div className={`mt-2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
          </button>
        );
      })}
    </div>
  );
}

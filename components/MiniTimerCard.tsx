
import React from 'react';
import { StandaloneTimer } from '../types';
import { Clock, CalendarClock } from 'lucide-react';

interface MiniTimerCardProps {
  timer: StandaloneTimer;
  currentTime: Date;
  onClick?: () => void;
}

export const MiniTimerCard: React.FC<MiniTimerCardProps> = ({ timer, currentTime, onClick }) => {
  const now = currentTime.getTime();
  const startTime = timer.startTime || now;

  // Logic to determine if scheduled or running
  const isScheduled = startTime > now;

  // Calculate display values
  let labelText = "Time Left";
  let timeDisplay = "";
  let progress = 0;
  let Icon = Clock;
  let iconColor = "text-blue-500";
  let barColor = "bg-blue-500";

  if (isScheduled) {
    // Future
    Icon = CalendarClock;
    iconColor = "text-zinc-400";
    barColor = "bg-zinc-400";
    labelText = "Starts in";

    const diffMs = startTime - now;
    const diffMins = Math.ceil(diffMs / 60000);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;

    timeDisplay = h > 0 ? `${h}h ${m}m` : `${m}m`;
    progress = 0; // Empty bar for scheduled
  } else {
    // Running
    const elapsed = (now - startTime) / 60000;
    const remaining = Math.max(0, timer.durationMinutes - elapsed);
    progress = Math.min(100, (elapsed / timer.durationMinutes) * 100);

    const h = Math.floor(remaining / 60);
    const m = Math.floor(remaining % 60);
    const s = Math.floor((remaining * 60) % 60);

    timeDisplay = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

    // If paused
    if (timer.status === 'paused' && timer.pausedTimeRemaining) {
      const pRem = timer.pausedTimeRemaining;
      const ph = Math.floor(pRem / 60);
      const pm = Math.floor(pRem % 60);
      timeDisplay = `${ph > 0 ? ph + 'h ' : ''}${pm}m (Paused)`;
      labelText = "Paused";
      iconColor = "text-amber-500";
      barColor = "bg-amber-500";
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden w-[140px] h-14 rounded-xl border
        flex shrink-0 select-none opacity-90 transition-colors cursor-pointer
        ${isScheduled
          ? 'bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed border-zinc-300 dark:border-zinc-700'
          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30'
        }
      `}
    >
      <div className="relative z-10 w-full h-full px-3 py-1.5 flex flex-col justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3 h-3 ${iconColor}`} />
          <span className="text-[10px] font-bold uppercase text-zinc-500 truncate max-w-[90px]">
            {timer.label}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-400 uppercase leading-none">{labelText}</span>
          <span className={`text-xs font-bold font-mono ${isScheduled ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {timeDisplay}
          </span>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 ${barColor} transition-all duration-1000`} style={{ width: `${progress}%` }} />
    </div>
  );
};


import React from 'react';
import { Experiment, StandaloneTimer } from '../types';
import { Sun, Moon, FlaskConical, Plus } from 'lucide-react';
import { MiniExperimentCard } from './MiniExperimentCard';
import { MiniTimerCard } from './MiniTimerCard';

interface TopBarProps {
  runningExperiments: Experiment[];
  activeTimers: StandaloneTimer[];
  activeExperimentId: string;
  currentTime: Date;
  isDarkMode: boolean;
  onSelectExperiment: (id: string) => void;
  onToggleTheme: () => void;
  onNewExperiment: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  runningExperiments, 
  activeTimers,
  activeExperimentId, 
  currentTime, 
  isDarkMode, 
  onSelectExperiment, 
  onToggleTheme, 
  onNewExperiment
}) => {
  const hasActiveItems = runningExperiments.length > 0 || activeTimers.length > 0;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-lab-dark/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 shadow-sm supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-lab-dark/60">
      <div className="w-full px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-baseline gap-3 shrink-0 md:hidden">
           <FlaskConical className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
           <span className="text-lg font-serif italic font-medium text-zinc-900 dark:text-white tracking-wide">
              BioCalc
            </span>
        </div>

        {/* Desktop Title */}
        <div className="hidden md:flex flex-col shrink-0">
             <span className="text-xl font-serif italic font-medium text-zinc-900 dark:text-white tracking-wide">
                BioCalc
              </span>
             <span className="text-[10px] font-sans tracking-[0.2em] text-zinc-500 uppercase">
                Laboratory
             </span>
        </div>

        {/* Combined Mini Timers Area */}
        <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar px-2 mask-linear-fade py-2 justify-end md:justify-start">
           {!hasActiveItems && (
             <span className="text-xs text-zinc-400 dark:text-zinc-600 italic hidden md:block pl-4">
               No active tasks...
             </span>
           )}
           
           {/* Experiments */}
           {runningExperiments.map(exp => (
             <MiniExperimentCard 
               key={exp.id}
               experiment={exp}
               isActive={exp.id === activeExperimentId}
               currentTime={currentTime}
               onClick={() => onSelectExperiment(exp.id)}
               isDarkMode={isDarkMode}
             />
           ))}

           {/* Standalone Timers */}
           {activeTimers.map(timer => (
             <MiniTimerCard 
               key={timer.id}
               timer={timer}
               currentTime={currentTime}
             />
           ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0 pl-2">
          <button
            onClick={onNewExperiment}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700 h-9 sm:h-10"
            aria-label="New Experiment"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>

          <button 
            onClick={onToggleTheme}
            className="p-2 sm:p-2.5 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

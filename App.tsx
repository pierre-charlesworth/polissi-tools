
import React, { useState, useEffect, useMemo } from 'react';
import { Calculator } from './components/Calculator';
import { MiniGrowthChart } from './components/MiniGrowthChart';
import { Sun, Moon, Plus, FlaskConical } from 'lucide-react';
import { Experiment } from './types';
import { calculateResults, calculateTracking, generateChartData } from './utils/calculations';

// New Component for the Top Bar Mini Card
const MiniTimerCard: React.FC<{ 
  experiment: Experiment; 
  isActive: boolean; 
  currentTime: Date;
  onClick: () => void;
  isDarkMode: boolean;
}> = ({ experiment, isActive, currentTime, onClick, isDarkMode }) => {
  const results = useMemo(() => calculateResults(experiment, experiment.trackingStartTime, currentTime), [experiment, currentTime]);
  const trackingStatus = useMemo(() => calculateTracking(experiment, experiment.trackingStartTime, currentTime, results), [experiment, currentTime, results]);
  const { data: chartData } = useMemo(() => generateChartData(experiment, results, trackingStatus), [experiment, results, trackingStatus]);

  if (!trackingStatus || !results.harvestDate) return null;

  const timeRemainingMinutes = Math.max(0, results.minutesToHarvest - trackingStatus.elapsedMinutes);
  const hoursRemaining = Math.floor(timeRemainingMinutes / 60);
  const minsRemaining = Math.round(timeRemainingMinutes % 60);

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden w-[160px] h-14 rounded-xl border flex cursor-pointer shrink-0 select-none
        transform transition-all duration-200 active:scale-[0.98]
        ${isActive 
          ? 'bg-white dark:bg-zinc-800 border-emerald-500 ring-1 ring-emerald-500/50 shadow-sm' 
          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 opacity-70 hover:opacity-100'
        }
      `}
    >
      {/* Tiny Chart Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <MiniGrowthChart 
          data={chartData} 
          currentOD={trackingStatus.currentOD} 
          targetOD={parseFloat(String(experiment.targetHarvestOD))}
          harvestTime={results.minutesToHarvest}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full px-3 py-1.5 flex flex-col justify-between">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold uppercase text-zinc-500 truncate max-w-[80px]">
            {experiment.name}
          </span>
          <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
            OD {trackingStatus.currentOD.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-end">
           <div className="flex flex-col">
             <span className="text-[9px] text-zinc-400 uppercase leading-none">Remaining</span>
             <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
               {hoursRemaining}h {minsRemaining}m
             </span>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[9px] text-zinc-400 uppercase leading-none">Finish</span>
             <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
               {results.harvestDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
           </div>
        </div>
      </div>
      
      {/* Progress Bar Line at Bottom */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" 
        style={{ width: `${trackingStatus.completionPercentage}%` }}
      />
    </div>
  );
};

const createNewExperiment = (count: number): Experiment => ({
  id: crypto.randomUUID(),
  name: `Exp ${count + 1}`,
  inoculumOD: '2.5',
  targetVolume: '500',
  targetStartOD: '0.1',
  targetHarvestOD: '0.8',
  doublingTime: '20',
  lagTime: '20',
  calculationMode: 'total_volume',
  trackingStartTime: null,
  createdAt: Date.now(),
});

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([createNewExperiment(0)]);
  const [activeExperimentId, setActiveExperimentId] = useState<string>(experiments[0].id);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Global Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleAddExperiment = () => {
    const newExp = createNewExperiment(experiments.length);
    setExperiments(prev => [...prev, newExp]);
    setActiveExperimentId(newExp.id);
  };

  const updateActiveExperiment = (updates: Partial<Experiment>) => {
    setExperiments(prev => prev.map(exp => 
      exp.id === activeExperimentId ? { ...exp, ...updates } : exp
    ));
  };

  const activeExperiment = experiments.find(e => e.id === activeExperimentId) || experiments[0];
  const runningExperiments = experiments.filter(e => e.trackingStartTime !== null);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-lab-dark font-sans text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-200 transition-colors duration-300 flex flex-col">
      <nav className="sticky top-0 z-30 bg-white/95 dark:bg-lab-dark/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 shadow-sm supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-lab-dark/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <div className="flex items-baseline gap-3 shrink-0">
            <span className="text-2xl font-serif italic font-medium text-zinc-900 dark:text-white tracking-wide hidden sm:inline-block">
              BioCalc
            </span>
             <FlaskConical className="w-6 h-6 sm:hidden text-emerald-600 dark:text-emerald-500" />
            <span className="text-xs font-sans tracking-[0.2em] text-zinc-500 uppercase hidden md:inline-block">
              Laboratory
            </span>
          </div>

          {/* Mini Timers Area - Scrollable */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar px-2 mask-linear-fade py-2">
             {runningExperiments.map(exp => (
               <MiniTimerCard 
                 key={exp.id}
                 experiment={exp}
                 isActive={exp.id === activeExperimentId}
                 currentTime={currentTime}
                 onClick={() => setActiveExperimentId(exp.id)}
                 isDarkMode={isDarkMode}
               />
             ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0 pl-2">
            <button
              onClick={handleAddExperiment}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-xs font-medium transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700 h-10"
              aria-label="New Experiment"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Exp</span>
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors active:scale-90"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto w-full px-4 pt-6 sm:pt-8 pb-12 sm:px-6 lg:px-8 flex-grow">
        <Calculator 
          key={activeExperiment.id} // Re-mount when switching to ensure clean animation state
          experiment={activeExperiment} 
          onUpdate={updateActiveExperiment}
          isDarkMode={isDarkMode}
          currentTime={currentTime}
        />
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center border-t border-zinc-200 dark:border-white/5 mt-4">
        <p className="text-[10px] tracking-[0.2em] text-zinc-400 dark:text-zinc-600 uppercase font-sans">
          &copy; 2025 THE <span className="font-serif italic text-sm text-zinc-600 dark:text-zinc-500 lowercase px-1" style={{ fontVariant: 'small-caps' }}>Polissi</span> LAB. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default App;

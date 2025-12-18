
import React, { useMemo } from 'react';
import { Experiment } from '../types';
import { calculateResults, calculateTracking, generateChartData } from '../utils/calculations';
import { MiniGrowthChart } from './MiniGrowthChart';

interface MiniExperimentCardProps {
  experiment: Experiment;
  isActive: boolean;
  currentTime: Date;
  onClick: () => void;
  isDarkMode: boolean;
}

export const MiniExperimentCard: React.FC<MiniExperimentCardProps> = ({ experiment, isActive, currentTime, onClick, isDarkMode }) => {
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
          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 opacity-90 hover:opacity-100'
        }
      `}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <MiniGrowthChart
          data={chartData}
          currentOD={trackingStatus.currentOD}
          targetOD={parseFloat(String(experiment.targetHarvestOD))}
          harvestTime={results.minutesToHarvest}
          isDarkMode={isDarkMode}
        />
      </div>

      <div className="relative z-10 w-full h-full px-3 py-1.5 flex flex-col justify-between">
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold uppercase text-zinc-500 truncate max-w-[80px]">
            {experiment.name}
          </span>
          <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {trackingStatus.currentOD.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-end">
           <div className="flex flex-col">
             <span className="text-[9px] text-zinc-400 uppercase leading-none">Remaining</span>
             <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
               {hoursRemaining}h {minsRemaining}m
             </span>
           </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" style={{ width: `${trackingStatus.completionPercentage}%` }} />
    </div>
  );
};

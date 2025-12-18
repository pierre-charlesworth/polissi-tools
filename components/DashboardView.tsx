
import React, { useState } from 'react';
import { StandaloneTimer, Experiment, View } from '../types';
import { 
  Bell, 
  Search, 
  Mic, 
  Timer, 
  Calculator, 
  Droplets, 
  Plus, 
  Microscope, 
  ArrowRight, 
  LineChart, 
  FlaskConical, 
  Layers, 
  ChevronRight,
  ScatterChart,
  Play,
  Sparkles
} from 'lucide-react';
import { MiniExperimentCard } from './MiniExperimentCard';
import { MiniTimerCard } from './MiniTimerCard';
import { AIProtocolModal } from './AIProtocolModal';

interface DashboardViewProps {
  activeTimers: StandaloneTimer[];
  experiments: Experiment[];
  onNavigate: (view: View) => void;
  onNewExperiment: (overrides?: Partial<Experiment>) => void;
  onAddTimer: (label: string, duration: number, autoStart?: boolean) => void;
  onSelectExperiment: (id: string) => void;
  isDarkMode: boolean;
  currentTime: Date;
}

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  colorClass?: string;
  bgClass?: string;
}

const QuickActionButton: React.FC<QuickActionProps> = ({ 
  icon: Icon, 
  label, 
  onClick, 
  colorClass = "text-zinc-700 dark:text-zinc-300", 
  bgClass = "bg-white dark:bg-zinc-800" 
}) => (
  <button onClick={onClick} className="flex flex-col gap-2 items-center group min-w-[72px] shrink-0">
    <div className={`
      h-16 w-16 rounded-2xl border border-zinc-200 dark:border-zinc-700 
      flex items-center justify-center shadow-sm 
      group-hover:scale-105 transition-all group-active:scale-95 
      ${bgClass} ${colorClass}
    `}>
      <Icon className="w-7 h-7 stroke-[1.5]" />
    </div>
    <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium text-center tracking-tight">{label}</span>
  </button>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeTimers,
  experiments,
  onNavigate,
  onNewExperiment,
  onAddTimer,
  onSelectExperiment,
  isDarkMode,
  currentTime
}) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const runningExperiments = experiments.filter(e => e.trackingStartTime !== null);
  const hasActiveTasks = activeTimers.length > 0 || runningExperiments.length > 0;
  const totalActive = activeTimers.length + runningExperiments.length;

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black/20 w-full max-w-md mx-auto md:max-w-full">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <div className="relative">
                <div className="bg-zinc-200 dark:bg-zinc-800 rounded-full h-14 w-14 ring-2 ring-blue-500/30 overflow-hidden">
                   {/* Placeholder Avatar */}
                   <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-blue-500 rounded-full border-2 border-zinc-50 dark:border-zinc-900"></div>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-zinc-900 dark:text-white text-lg font-bold leading-tight">Good Morning, Dr. Alistair</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-normal">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • <span className="text-blue-500 font-medium">{totalActive} Active Tasks</span>
                </p>
              </div>
            </div>
            <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </button>
          </div>

          {/* Active Tasks Horizontal Scroll */}
          <div className="mt-6 -mx-5 px-5 overflow-x-auto no-scrollbar pb-2">
            <div className="flex gap-3 w-max">
              {/* If no active tasks, show placeholder in place */}
              {!hasActiveTasks && (
                <div 
                  onClick={() => onNavigate('timers')}
                  className="bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl w-full max-w-[320px] p-4 flex items-center justify-center text-zinc-400 gap-2 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors h-20"
                >
                   <Timer className="w-5 h-5 opacity-50" />
                   <span className="text-sm font-medium">No active tasks</span>
                </div>
              )}

              {runningExperiments.map(exp => (
                 <MiniExperimentCard 
                   key={exp.id}
                   experiment={exp}
                   isActive={false} // Dashboard doesn't highlight selected
                   currentTime={currentTime}
                   onClick={() => onSelectExperiment(exp.id)}
                   isDarkMode={isDarkMode}
                 />
               ))}

               {activeTimers.map(timer => (
                 <MiniTimerCard 
                   key={timer.id}
                   timer={timer}
                   currentTime={currentTime}
                   onClick={() => onNavigate('timers')}
                 />
               ))}
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="px-5 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-8 md:gap-y-10">
          
          {/* 1. AI Assistant (Replaces Search) */}
          <div 
            onClick={() => setIsAIModalOpen(true)}
            className="group relative bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white overflow-hidden shadow-lg shadow-indigo-500/20 cursor-pointer transition-transform active:scale-[0.98] h-full"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                   <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                     <Sparkles className="w-4 h-4 text-white" />
                   </div>
                   <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">AI Assistant</span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">Describe your protocol...</h3>
                <p className="text-indigo-100 text-sm max-w-[90%] leading-relaxed">
                  "Grow E. coli to OD 0.6 in 500mL" or "Timer for 10 mins"
                </p>
              </div>
              
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors w-fit">
                Try it now <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* 2. Quick Actions Section */}
          <div>
            <div className="flex justify-between items-center mb-4 h-6">
                <h3 className="text-zinc-900 dark:text-white text-base font-bold">Quick Actions</h3>
                <button className="text-blue-500 text-xs font-semibold hover:text-blue-600">Edit</button>
            </div>
            {/* Mobile: Scroll, Desktop: Grid */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible no-scrollbar">
              <QuickActionButton 
                icon={Timer} 
                label="Timer" 
                onClick={() => onNavigate('timers')} 
                colorClass="text-blue-500"
              />
              <QuickActionButton 
                icon={Calculator} 
                label="Molarity" 
                onClick={() => onNavigate('calculator')} 
              />
              <QuickActionButton 
                icon={Droplets} 
                label="Dilution" 
                onClick={() => onNavigate('calculator')} 
              />
              <QuickActionButton 
                icon={Plus} 
                label="New Exp" 
                onClick={() => onNewExperiment()} 
                colorClass="text-white"
                bgClass="bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
              />
            </div>
          </div>

          {/* 3. Lab Planners */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-zinc-900 dark:text-white text-base font-bold">Lab Planners</h3>
              <button className="text-blue-500 text-xs font-semibold hover:text-blue-600">Edit</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2 group hover:border-blue-500/50 cursor-pointer transition-colors shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <Microscope className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-semibold text-sm">PCR Setup</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0">Last: 35 cycles, 55°C</p>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2 group hover:border-blue-500/50 cursor-pointer transition-colors shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <LineChart className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <h4 className="text-zinc-900 dark:text-white font-semibold text-sm">Growth Curve</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0">E. coli @ 37°C</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Recent Protocols */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-zinc-900 dark:text-white text-base font-bold">Recent Protocols</h3>
              <button onClick={() => onNavigate('experiments')} className="text-blue-500 text-xs font-semibold hover:text-blue-600">View All</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {experiments.slice(0, 3).map((exp, idx) => (
                <div key={exp.id} onClick={() => { onSelectExperiment(exp.id); onNavigate('calculator'); }} className="flex items-center p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 gap-3 hover:border-blue-500/30 cursor-pointer transition-colors shadow-sm group">
                  <div className={`
                    h-10 w-10 rounded-lg flex items-center justify-center border
                    ${idx % 3 === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' : ''}
                    ${idx % 3 === 1 ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20' : ''}
                    ${idx % 3 === 2 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' : ''}
                  `}>
                    {idx % 3 === 0 && <FlaskConical className="w-5 h-5" />}
                    {idx % 3 === 1 && <Layers className="w-5 h-5" />}
                    {idx % 3 === 2 && <ScatterChart className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-zinc-900 dark:text-white text-sm font-semibold truncate">{exp.name}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">Modified: {new Date(exp.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                     {idx < 2 ? <Play className="w-4 h-4 fill-current" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      <AIProtocolModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onCreateExperiment={onNewExperiment}
        onCreateTimer={onAddTimer}
      />
    </div>
  );
};

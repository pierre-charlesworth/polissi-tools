
import React from 'react';
import { Settings, FlaskConical, Plus, Library, Clock, Home, LineChart, ClipboardList } from 'lucide-react';
import { View } from '../types';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onNewExperiment: () => void;
}

export const NavigationRail: React.FC<NavigationProps> = ({ currentView, onViewChange, onNewExperiment }) => {
  return (
    <nav className="hidden md:flex flex-col justify-between w-20 h-screen bg-white dark:bg-lab-card border-r border-zinc-200 dark:border-white/5 py-6 z-40 shrink-0 transition-colors duration-300">
      <div className="flex flex-col items-center gap-8">
        {/* App Logo - Resets to Dashboard */}
        <button 
          onClick={() => onViewChange('dashboard')}
          className="text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform duration-200"
          title="BioCalc Home"
        >
          <FlaskConical className="w-8 h-8" />
        </button>

        {/* FAB - New Experiment */}
        <button
          onClick={onNewExperiment}
          className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center hover:shadow-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all active:scale-95 group"
          title="New Experiment"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Nav Items */}
        <div className="flex flex-col gap-4 w-full">
          <NavItem 
            icon={Home} 
            label="Home" 
            isActive={currentView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')} 
          />
          <NavItem 
            icon={ClipboardList} 
            label="Protocols" 
            isActive={currentView === 'protocols'} 
            onClick={() => onViewChange('protocols')} 
          />
          <NavItem 
            icon={LineChart} 
            label="Growth" 
            isActive={currentView === 'calculator'} 
            onClick={() => onViewChange('calculator')} 
          />
          <NavItem 
            icon={Clock} 
            label="Timers" 
            isActive={currentView === 'timers'} 
            onClick={() => onViewChange('timers')} 
          />
          <NavItem 
            icon={Library} 
            label="Library" 
            isActive={currentView === 'experiments'} 
            onClick={() => onViewChange('experiments')} 
          />
          <NavItem 
            icon={Settings} 
            label="Settings" 
            isActive={currentView === 'settings'} 
            onClick={() => onViewChange('settings')} 
          />
        </div>
      </div>
    </nav>
  );
};

export const BottomNavigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-lab-card border-t border-zinc-200 dark:border-white/5 h-20 px-4 pb-4 pt-2 z-50 flex justify-around items-center transition-colors duration-300 safe-area-bottom">
      <NavItemMobile 
        icon={Home} 
        label="Home" 
        isActive={currentView === 'dashboard'} 
        onClick={() => onViewChange('dashboard')} 
      />
      <NavItemMobile 
        icon={ClipboardList} 
        label="Steps" 
        isActive={currentView === 'protocols'} 
        onClick={() => onViewChange('protocols')} 
      />
      <NavItemMobile 
        icon={LineChart} 
        label="Growth" 
        isActive={currentView === 'calculator'} 
        onClick={() => onViewChange('calculator')} 
      />
      <NavItemMobile 
        icon={Clock} 
        label="Timers" 
        isActive={currentView === 'timers'} 
        onClick={() => onViewChange('timers')} 
      />
      <NavItemMobile 
        icon={Library} 
        label="Lib" 
        isActive={currentView === 'experiments'} 
        onClick={() => onViewChange('experiments')} 
      />
    </nav>
  );
};

const NavItem: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 w-full py-2 relative group"
  >
    <div className={`
      w-14 h-8 rounded-full flex items-center justify-center transition-colors duration-200
      ${isActive 
        ? 'bg-zinc-900 dark:bg-emerald-400 text-white dark:text-zinc-900' 
        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 dark:text-zinc-400'
      }
    `}>
      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    </div>
    <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-zinc-900 dark:text-emerald-400' : 'text-zinc-500'}`}>
      {label}
    </span>
  </button>
);

const NavItemMobile: React.FC<{ icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 flex flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
  >
    <div className={`
      px-5 py-1 rounded-full transition-colors duration-200
      ${isActive 
        ? 'bg-zinc-900 dark:bg-emerald-400 text-white dark:text-zinc-900' 
        : 'text-zinc-500 dark:text-zinc-400'
      }
    `}>
      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    </div>
    <span className={`text-xs font-medium ${isActive ? 'text-zinc-900 dark:text-emerald-400' : 'text-zinc-500'}`}>
      {label}
    </span>
  </button>
);

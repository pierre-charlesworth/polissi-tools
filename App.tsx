
import React, { useState, useEffect } from 'react';
import { NavigationRail, BottomNavigation } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { CalculatorView } from './components/CalculatorView';
import { TimerView } from './components/TimerView';
import { DashboardView } from './components/DashboardView';
import { ProtocolView } from './components/ProtocolView';
import { Experiment, StandaloneTimer, View, Protocol } from './types';
import { Construction } from 'lucide-react';
import { AIProtocolModal } from './components/AIProtocolModal';

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

const defaultProtocols: Protocol[] = [
  {
    id: 'p-transformation',
    title: 'Heat Shock Transformation',
    description: 'Standard protocol for chemically competent E. coli (e.g., DH5a, BL21).',
    tags: ['Cloning', 'Bacteria'],
    createdAt: Date.now(),
    steps: [
      { id: 's1', text: 'Thaw competent cells on ice (~10 min).', isCompleted: false, action: { type: 'timer', durationMinutes: 10, timerLabel: 'Thaw Cells' } },
      { id: 's2', text: 'Add 1-5 µL plasmid DNA to cells. Flick gently to mix. Do not vortex.', isCompleted: false },
      { id: 's3', text: 'Incubate on ice for 30 minutes.', isCompleted: false, action: { type: 'timer', durationMinutes: 30, timerLabel: 'Ice Incubation' } },
      { id: 's4', text: 'Heat shock at 42°C for exactly 45 seconds.', isCompleted: false, action: { type: 'timer', durationMinutes: 0.75, timerLabel: 'Heat Shock' } },
      { id: 's5', text: 'Place on ice for 2 minutes.', isCompleted: false, action: { type: 'timer', durationMinutes: 2, timerLabel: 'Cool Down' } },
      { id: 's6', text: 'Add 950 µL SOC media (room temp).', isCompleted: false },
      { id: 's7', text: 'Shake at 37°C for 1 hour at 225 rpm.', isCompleted: false, action: { type: 'timer', durationMinutes: 60, timerLabel: 'Recovery' } },
      { id: 's8', text: 'Plate 50-100 µL on selective agar plates.', isCompleted: false }
    ]
  },
  {
    id: 'p-western',
    title: 'Western Blot (Day 1)',
    description: 'SDS-PAGE electrophoresis and wet transfer to PVDF membrane.',
    tags: ['Protein', 'Western'],
    createdAt: Date.now(),
    steps: [
      { id: 'wb1', text: 'Mix protein samples with 4X Loading Buffer.', isCompleted: false },
      { id: 'wb2', text: 'Boil samples at 95°C for 5 min.', isCompleted: false, action: { type: 'timer', durationMinutes: 5, timerLabel: 'Boil Samples' } },
      { id: 'wb3', text: 'Load gel and run at 120V.', isCompleted: false, action: { type: 'timer', durationMinutes: 60, timerLabel: 'Run Gel' } },
      { id: 'wb4', text: 'Activate PVDF membrane with methanol for 1 min, then rinse.', isCompleted: false },
      { id: 'wb5', text: 'Assemble transfer sandwich (Black-Sponge-Paper-Gel-Membrane-Paper-Sponge-Clear).', isCompleted: false },
      { id: 'wb6', text: 'Run wet transfer at 100V (cold).', isCompleted: false, action: { type: 'timer', durationMinutes: 60, timerLabel: 'Transfer' } },
      { id: 'wb7', text: 'Block membrane in 5% Milk/TBST.', isCompleted: false, action: { type: 'timer', durationMinutes: 60, timerLabel: 'Blocking' } },
      { id: 'wb8', text: 'Incubate Primary Antibody overnight at 4°C.', isCompleted: false, action: { type: 'timer', durationMinutes: 720, timerLabel: 'Primary Ab' } }
    ]
  },
  {
    id: 'p-growth',
    title: 'Bacterial Growth Setup',
    description: 'Inoculation calculation and start-up for a growth curve.',
    tags: ['Microbiology'],
    createdAt: Date.now(),
    steps: [
      { id: 'g1', text: 'Measure OD600 of overnight culture.', isCompleted: false },
      { id: 'g2', text: 'Calculate volume required for subculture.', isCompleted: false, action: { type: 'experiment', experimentConfig: { name: 'Growth Curve', targetStartOD: '0.05', targetVolume: '50' } } },
      { id: 'g3', text: 'Inoculate fresh media.', isCompleted: false },
      { id: 'g4', text: 'Start shaking incubator at 37°C.', isCompleted: false }
    ]
  }
];

// Simple Placeholder for other modules
const PlaceholderView: React.FC<{ title: string, icon: React.ElementType }> = ({ title, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 p-8 text-center animate-in fade-in zoom-in duration-300">
    <div className="bg-zinc-100 dark:bg-white/5 p-6 rounded-full mb-6">
       <Icon className="w-12 h-12 opacity-50" />
    </div>
    <h2 className="text-2xl font-serif italic mb-2 text-zinc-900 dark:text-zinc-100">{title}</h2>
    <p className="max-w-xs text-sm">This module is currently under development. Check back later for updates.</p>
  </div>
);

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Data State
  const [experiments, setExperiments] = useState<Experiment[]>([createNewExperiment(0)]);
  const [timers, setTimers] = useState<StandaloneTimer[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>(defaultProtocols);
  
  const [activeExperimentId, setActiveExperimentId] = useState<string>(experiments[0].id);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Global Clock & Timer Lifecycle
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      setTimers(prev => {
        let updated = false;
        const nextTimers = prev.map(t => {
          if (t.status === 'running' && t.startTime) {
             const endTime = t.startTime + (t.durationMinutes * 60000);
             if (now.getTime() >= endTime) {
               updated = true;
               // Reset to idle (unscheduled) when duration completes
               return { ...t, status: 'idle', startTime: null, pausedTimeRemaining: null } as StandaloneTimer;
             }
          }
          return t;
        });
        return updated ? nextTimers : prev;
      });
    }, 1000);
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

  // --- Experiment Handlers ---
  const handleAddExperiment = (overrides?: Partial<Experiment>) => {
    const baseExp = createNewExperiment(experiments.length);
    const newExp = { ...baseExp, ...overrides, id: baseExp.id, createdAt: Date.now() };
    setExperiments(prev => [...prev, newExp]);
    setActiveExperimentId(newExp.id);
    setCurrentView('calculator'); 
  };

  const updateActiveExperiment = (updates: Partial<Experiment>) => {
    setExperiments(prev => prev.map(exp => 
      exp.id === activeExperimentId ? { ...exp, ...updates } : exp
    ));
  };

  // --- Timer Handlers ---
  const handleAddTimer = (label: string, duration: number, autoStart = false) => {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newTimer: StandaloneTimer = {
      id,
      label,
      durationMinutes: duration,
      startTime: autoStart ? now : null,
      pausedTimeRemaining: null,
      status: autoStart ? 'running' : 'idle',
      createdAt: now
    };
    setTimers(prev => [...prev, newTimer]);
    return id;
  };

  const updateTimer = (id: string, updates: Partial<StandaloneTimer>) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  // --- Protocol Handlers ---
  const handleAddProtocol = (protocol: Protocol) => {
    setProtocols(prev => [...prev, protocol]);
    setCurrentView('protocols');
  };

  const updateProtocol = (id: string, updates: Partial<Protocol>) => {
    setProtocols(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProtocol = (id: string) => {
    setProtocols(prev => prev.filter(p => p.id !== id));
  };

  // --- Derived State ---
  const activeExperiment = experiments.find(e => e.id === activeExperimentId) || experiments[0];
  const runningExperiments = experiments.filter(e => e.trackingStartTime !== null);
  const activeTimers = timers.filter(t => t.status === 'running' || t.status === 'paused');

  return (
    <div className="flex h-screen w-full bg-zinc-50 dark:bg-lab-dark font-sans text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-800 dark:selection:text-emerald-200 transition-colors duration-300 overflow-hidden">
      
      {/* Desktop Navigation Rail */}
      <NavigationRail 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onNewExperiment={() => handleAddExperiment()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Bar (Context-aware: Hidden on Dashboard) */}
        {currentView !== 'dashboard' && (
          <TopBar 
            runningExperiments={runningExperiments}
            activeTimers={activeTimers}
            activeExperimentId={activeExperimentId}
            currentTime={currentTime}
            isDarkMode={isDarkMode}
            onSelectExperiment={(id) => {
              setActiveExperimentId(id);
              setCurrentView('calculator');
            }}
            onToggleTheme={toggleTheme}
            onNewExperiment={() => handleAddExperiment()}
          />
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          
          {currentView === 'dashboard' && (
            <DashboardView 
              activeTimers={activeTimers}
              experiments={experiments}
              onNavigate={setCurrentView}
              onNewExperiment={handleAddExperiment}
              onAddTimer={handleAddTimer}
              currentTime={currentTime}
              onSelectExperiment={(id) => {
                setActiveExperimentId(id);
                setCurrentView('calculator');
              }}
              isDarkMode={isDarkMode}
            />
          )}

          {currentView === 'calculator' && (
            <CalculatorView 
              key={activeExperiment.id}
              experiment={activeExperiment}
              onUpdate={updateActiveExperiment}
              isDarkMode={isDarkMode}
              currentTime={currentTime}
            />
          )}

          {currentView === 'timers' && (
            <TimerView 
              timers={timers}
              experiments={experiments}
              onAddTimer={handleAddTimer}
              onUpdateTimer={updateTimer}
              onDeleteTimer={deleteTimer}
              currentTime={currentTime}
            />
          )}

          {currentView === 'protocols' && (
             <ProtocolView 
               protocols={protocols}
               timers={timers}
               currentTime={currentTime}
               onAddTimer={handleAddTimer}
               onNewExperiment={handleAddExperiment}
               onDeleteProtocol={deleteProtocol}
               onUpdateProtocol={updateProtocol}
               onOpenAIModal={() => setIsAIModalOpen(true)}
             />
          )}
          
          {currentView === 'experiments' && (
             <PlaceholderView title="Experiment Library" icon={Construction} />
          )}

          {currentView === 'settings' && (
             <PlaceholderView title="Settings" icon={Construction} />
          )}

          {/* Footer inside scroll area (only if not dashboard, as dashboard has own layout structure) */}
          {currentView !== 'dashboard' && (
            <footer className="w-full px-4 py-8 text-center mt-auto opacity-50 hover:opacity-100 transition-opacity">
              <p className="text-[10px] tracking-[0.2em] uppercase font-sans">
                &copy; 2025 THE <span className="font-serif italic text-sm lowercase px-1" style={{ fontVariant: 'small-caps' }}>Polissi</span> LAB.
              </p>
            </footer>
          )}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <BottomNavigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onNewExperiment={() => handleAddExperiment()}
        />

        {/* Global AI Modal */}
        <AIProtocolModal 
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onCreateExperiment={handleAddExperiment}
          onCreateTimer={handleAddTimer}
          onCreateProtocol={handleAddProtocol}
        />
      </div>
    </div>
  );
};

export default App;

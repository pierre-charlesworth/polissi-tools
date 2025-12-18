
import React, { useState, useMemo, useRef } from 'react';
import { StandaloneTimer, Experiment } from '../types';
import { Play, Pause, RotateCcw, Trash2, Clock, Calendar, Plus, Hourglass, GripVertical, ArrowRight, CalendarClock, ListPlus, Download, Copy, Timer } from 'lucide-react';
import { calculateResults } from '../utils/calculations';

interface TimerViewProps {
  timers: StandaloneTimer[];
  experiments: Experiment[];
  onAddTimer: (label: string, duration: number, autoStart?: boolean) => void;
  onUpdateTimer: (id: string, updates: Partial<StandaloneTimer>) => void;
  onDeleteTimer: (id: string) => void;
  currentTime: Date;
}

// Helper to normalize timeline items
interface TimelineItem {
  id: string;
  type: 'timer' | 'experiment';
  label: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  progress: number;
  colorClass: string;
  bgClass: string;
  isDraggable: boolean;
  status: string; // for display text
  isScheduled: boolean; // if start time > now
}

// Local M3 Input Component for visual consistency
const M3Input = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  className = "",
  placeholder = " " 
}: { 
  label: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  type?: string;
  className?: string;
  placeholder?: string;
}) => (
  <div className={`relative ${className}`}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="
        peer block w-full h-14 rounded-xl border bg-transparent px-4 pt-5 pb-2 
        text-sm font-medium text-zinc-900 dark:text-zinc-100 
        border-zinc-300 dark:border-zinc-700
        focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none
        placeholder-transparent transition-all
        disabled:opacity-50
      "
    />
    <label className="
      absolute left-4 top-2 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 transition-all
      peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
      peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:text-blue-500
      pointer-events-none select-none
    ">
      {label}
    </label>
  </div>
);

const SNAP_MINUTES = 1;

export const TimerView: React.FC<TimerViewProps> = ({ 
  timers, 
  experiments, 
  onAddTimer, 
  onUpdateTimer, 
  onDeleteTimer,
  currentTime 
}) => {
  const [newTimerLabel, setNewTimerLabel] = useState('');
  const [newTimerDuration, setNewTimerDuration] = useState('15');
  const [showETA, setShowETA] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Drag State
  const [isDraggingOverTimeline, setIsDraggingOverTimeline] = useState(false);
  const [isUnscheduledDropActive, setIsUnscheduledDropActive] = useState(false);
  const [dragPreviewTime, setDragPreviewTime] = useState<Date | null>(null);
  const dragOffsetRef = useRef(0);

  // --- CONTROLS ---

  const handleCreate = (e: React.FormEvent, autoStart = false) => {
    e.preventDefault();
    if (newTimerLabel && newTimerDuration) {
      onAddTimer(newTimerLabel, parseFloat(newTimerDuration), autoStart);
      setNewTimerLabel('');
    }
  };

  const handleToggleTimer = (timer: StandaloneTimer) => {
    if (timer.status === 'running') {
      // Pause
      const elapsed = (Date.now() - (timer.startTime || Date.now())) / 60000;
      const remaining = Math.max(0, timer.durationMinutes - elapsed);
      onUpdateTimer(timer.id, { status: 'paused', pausedTimeRemaining: remaining, startTime: null });
    } else {
      // Start (Now) or Resume
      const remaining = timer.status === 'paused' ? (timer.pausedTimeRemaining || timer.durationMinutes) : timer.durationMinutes;
      const effectiveStartTime = Date.now() - ((timer.durationMinutes - remaining) * 60000);
      onUpdateTimer(timer.id, { status: 'running', startTime: effectiveStartTime, pausedTimeRemaining: null });
    }
  };

  const handleReset = (timer: StandaloneTimer) => {
    onUpdateTimer(timer.id, { status: 'idle', startTime: null, pausedTimeRemaining: null });
  };
  
  const handleCopyTimer = (timer: StandaloneTimer) => {
    onAddTimer(timer.label, timer.durationMinutes, false);
  };

  // --- GANTT DATA & SCALING ---
  
  const now = currentTime.getTime();
  const pixelsPerMinute = 3;
  // Viewport: Start at Now - 30 mins
  const viewStart = now - 30 * 60000;
  
  // Calculate max extent
  const allEndTimes = [
    ...timers.filter(t => t.startTime).map(t => t.startTime! + t.durationMinutes * 60000),
    ...experiments.filter(e => e.trackingStartTime).map(e => calculateResults(e, e.trackingStartTime, currentTime).harvestDate?.getTime() || 0)
  ];
  const maxContentTime = Math.max(now, ...allEndTimes);
  const viewEnd = Math.max(now + 240 * 60000, maxContentTime + 60 * 60000); // Min 4h lookahead
  const totalViewDurationMs = viewEnd - viewStart;

  const getPosition = (date: Date | number) => {
    const d = typeof date === 'number' ? date : date.getTime();
    return ((d - viewStart) / 60000) * pixelsPerMinute;
  };

  const getTimeFromX = (x: number) => {
    if (!timelineRef.current) return now;
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = x - rect.left + timelineRef.current.scrollLeft;
    const minutesOffset = relativeX / pixelsPerMinute;
    return viewStart + minutesOffset * 60000;
  };

  const snapToGrid = (time: number) => {
    const coeff = 1000 * 60 * SNAP_MINUTES;
    return new Date(Math.round(time / coeff) * coeff);
  };

  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. Experiments
    experiments.forEach(exp => {
      if (exp.trackingStartTime) {
        const results = calculateResults(exp, exp.trackingStartTime, currentTime);
        if (results.isValid && results.harvestDate) {
          const totalDuration = results.minutesToHarvest;
          const elapsed = (currentTime.getTime() - exp.trackingStartTime) / 60000;
          const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
          
          items.push({
            id: exp.id,
            type: 'experiment',
            label: exp.name,
            start: new Date(exp.trackingStartTime),
            end: results.harvestDate,
            durationMinutes: totalDuration,
            progress,
            colorClass: 'bg-emerald-500',
            bgClass: 'bg-emerald-500/10 border-emerald-500/20 cursor-default',
            isDraggable: false,
            status: 'Running',
            isScheduled: false
          });
        }
      }
    });

    // 2. Timers
    timers.forEach(t => {
      if (t.status === 'running' && t.startTime) {
        const end = new Date(t.startTime + t.durationMinutes * 60000);
        const start = new Date(t.startTime);
        const isScheduled = t.startTime > now;
        
        let progress = 0;
        let status = 'Running';
        let bgClass = 'bg-blue-500/10 border-blue-500/20 cursor-move hover:bg-blue-500/20';

        if (isScheduled) {
            // Future Scheduled
            progress = 0;
            const diffM = Math.ceil((t.startTime - now) / 60000);
            const h = Math.floor(diffM/60);
            const m = diffM % 60;
            status = `Starts in ${h > 0 ? h + 'h ' : ''}${m}m`;
            
            // Dotted/Lighter look for scheduled
            bgClass = 'bg-white/50 dark:bg-white/5 border-dashed border-zinc-400 dark:border-zinc-600 cursor-move text-zinc-500';
        } else {
            // Actively Running
            const elapsed = (now - t.startTime) / 60000;
            progress = Math.min(100, Math.max(0, (elapsed / t.durationMinutes) * 100));
        }

        items.push({
          id: t.id,
          type: 'timer',
          label: t.label,
          start: start,
          end: end,
          durationMinutes: t.durationMinutes,
          progress,
          colorClass: isScheduled ? 'bg-zinc-400' : 'bg-blue-500',
          bgClass,
          isDraggable: true,
          status,
          isScheduled
        });
      }
    });

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [experiments, timers, currentTime, now]);

  // --- LAYOUT ENGINE (SWIMLANES) ---
  const { rowItems, totalRows } = useMemo(() => {
    const rows: number[] = []; // Stores the visual end time of the last item in each row
    const ROW_SPACING_MINUTES = 5; // Minimum gap in minutes between items in same row

    const processed = timelineItems.map(item => {
      // Calculate visual width in minutes (accounting for min-width 60px)
      const visualDurationMinutes = Math.max(item.durationMinutes, 60 / pixelsPerMinute);
      const visualEnd = item.start.getTime() + (visualDurationMinutes + ROW_SPACING_MINUTES) * 60000;
      
      let rowIndex = -1;
      
      // Try to fit in existing rows
      for (let r = 0; r < rows.length; r++) {
        if (rows[r] <= item.start.getTime()) {
          rowIndex = r;
          rows[r] = visualEnd;
          break;
        }
      }
      
      // If no fit, create new row
      if (rowIndex === -1) {
        rowIndex = rows.length;
        rows.push(visualEnd);
      }
      
      return { ...item, rowIndex };
    });

    return { 
      rowItems: processed, 
      totalRows: Math.max(rows.length, 6) // Minimum rows for aesthetic vertical space
    };
  }, [timelineItems, pixelsPerMinute]);

  const ROW_HEIGHT = 52;
  const HEADER_HEIGHT = 40;
  const CONTAINER_HEIGHT = Math.max(500, (totalRows * ROW_HEIGHT) + HEADER_HEIGHT + 20);

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e: React.DragEvent, id: string, type: 'timer' | 'new_timer') => {
    e.dataTransfer.setData("timerId", id);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.effectAllowed = "move";

    // Capture the click offset relative to the element's left edge
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffsetRef.current = e.clientX - rect.left;
  };

  // Timeline Drop Logic
  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverTimeline(true);
    e.dataTransfer.dropEffect = "move";
    
    // Calculate and snap preview time
    // Subtract offset so the preview line aligns with the left edge of the dragged item
    const rawTime = getTimeFromX(e.clientX - dragOffsetRef.current);
    const snapped = snapToGrid(rawTime);
    setDragPreviewTime(snapped);
  };

  const handleTimelineDragLeave = () => {
    setIsDraggingOverTimeline(false);
    setDragPreviewTime(null);
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverTimeline(false);
    setDragPreviewTime(null);
    
    const timerId = e.dataTransfer.getData("timerId");
    // Subtract offset for drop calculation
    const rawTime = getTimeFromX(e.clientX - dragOffsetRef.current);
    
    // Snap to nearest SNAP_MINUTES
    const roundedTime = snapToGrid(rawTime).getTime();

    // Find the timer
    const timer = timers.find(t => t.id === timerId);
    if (timer) {
      onUpdateTimer(timer.id, {
        status: 'running',
        startTime: roundedTime, // Strictly set start time to drop location
        pausedTimeRemaining: null 
      });
    }
  };

  // Unscheduled Drop Logic (To Remove/Unschedule)
  const handleUnscheduledDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsUnscheduledDropActive(true);
    e.dataTransfer.dropEffect = "move";
  };

  const handleUnscheduledDragLeave = () => {
    setIsUnscheduledDropActive(false);
  };

  const handleUnscheduledDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsUnscheduledDropActive(false);
    const timerId = e.dataTransfer.getData("timerId");
    
    if (timerId) {
      const timer = timers.find(t => t.id === timerId);
      if (timer) {
        // Reset to idle/unscheduled
        onUpdateTimer(timer.id, { status: 'idle', startTime: null, pausedTimeRemaining: null });
      }
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getDisplayText = (item: TimelineItem) => {
    if (item.isScheduled) {
       return formatTime(item.start);
    }
    const diff = Math.ceil((item.end.getTime() - now) / 60000);
    if (diff <= 0) return "Done";
    if (showETA) return formatTime(item.end);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m left`;
  };

  const unscheduledTimers = timers.filter(t => t.status === 'idle' || t.status === 'paused');

  return (
    <div className="w-full px-4 pt-6 pb-32 sm:px-6 lg:px-8 animate-in fade-in duration-500 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-serif italic text-zinc-900 dark:text-zinc-100">Lab Timeline</h2>
           <p className="text-sm text-zinc-500 dark:text-zinc-400">Drag tasks onto the timeline to schedule them</p>
        </div>
        
        {/* View Toggles */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-white/5 self-start">
           <button 
             onClick={() => setShowETA(false)}
             className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${!showETA ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
           >
             Time Left
           </button>
           <button 
             onClick={() => setShowETA(true)}
             className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${showETA ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
           >
             ETA
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 h-[600px] lg:h-[600px]">
        
        {/* LEFT COLUMN: Sidebar / Task Queue */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-hidden">
           
           {/* Creator Card */}
           <div className="bg-white dark:bg-lab-card rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-zinc-100">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-serif italic font-medium text-lg">New Task</h3>
              </div>
              <form onSubmit={(e) => handleCreate(e, false)} className="space-y-4">
                <M3Input 
                  label="Task Label" 
                  value={newTimerLabel}
                  onChange={e => setNewTimerLabel(e.target.value)}
                />
                
                <div className="flex gap-3">
                  <div className="w-24 shrink-0">
                    <M3Input 
                      label="Duration"
                      type="number"
                      value={newTimerDuration}
                      onChange={e => setNewTimerDuration(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 flex gap-2">
                     <button 
                       type="button"
                       onClick={(e) => handleCreate(e as any, false)}
                       disabled={!newTimerLabel}
                       className="flex-1 flex flex-col items-center justify-center h-14 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 active:scale-95 border border-transparent dark:border-white/5"
                       title="Add to queue"
                     >
                       <ListPlus className="w-5 h-5 mb-0.5" />
                       Queue
                     </button>
                     <button 
                       type="button"
                       onClick={(e) => handleCreate(e as any, true)}
                       disabled={!newTimerLabel}
                       className="flex-1 flex flex-col items-center justify-center h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95"
                       title="Start immediately"
                     >
                       <Play className="w-5 h-5 mb-0.5 fill-current" />
                       Start
                     </button>
                  </div>
                </div>
              </form>
           </div>

           {/* Unscheduled List (Drop Target) */}
           <div 
             className={`
               flex-1 rounded-2xl border p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors duration-200
               ${isUnscheduledDropActive 
                 ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 dark:border-blue-400 shadow-inner' 
                 : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5'
               }
             `}
             onDragOver={handleUnscheduledDragOver}
             onDragLeave={handleUnscheduledDragLeave}
             onDrop={handleUnscheduledDrop}
           >
              <div className="sticky top-0 z-10 py-2 -mt-2 mb-2 flex justify-between items-center bg-inherit">
                 <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Unscheduled Tasks</h3>
                 {isUnscheduledDropActive && (
                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 animate-pulse flex items-center gap-1 bg-white dark:bg-zinc-800 px-2 py-1 rounded-md shadow-sm">
                      <Download className="w-3 h-3" /> Drop to Remove
                    </span>
                 )}
              </div>
              
              {unscheduledTimers.length === 0 && !isUnscheduledDropActive && (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 opacity-60">
                   <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <Timer className="w-8 h-8 text-zinc-400" />
                   </div>
                   <span className="text-sm font-medium">No idle tasks</span>
                   <span className="text-xs">Create one above</span>
                </div>
              )}

              {unscheduledTimers.map(t => (
                <div 
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id, 'timer')}
                  className="bg-white dark:bg-lab-card p-4 rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm cursor-move hover:border-blue-400 dark:hover:border-blue-500/50 group transition-all active:scale-95 hover:shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                       <GripVertical className="w-5 h-5 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                       <div>
                         <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t.label}</p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <p className="text-xs text-zinc-500 font-mono">{t.durationMinutes} min</p>
                         </div>
                       </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                       <button onClick={() => handleToggleTimer(t)} title="Start Now" className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 rounded-lg transition-colors"><Play className="w-4 h-4 fill-current" /></button>
                       <button onClick={() => handleCopyTimer(t)} title="Duplicate" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg transition-colors"><Copy className="w-4 h-4" /></button>
                       <button onClick={() => onDeleteTimer(t.id)} title="Delete" className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* RIGHT COLUMN: GANTT CHART */}
        <div className="lg:col-span-3 bg-white dark:bg-lab-card rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col relative h-full">
           
           {/* Timeline Header */}
           <div className="h-12 border-b border-zinc-100 dark:border-white/5 flex items-center px-4 bg-zinc-50/50 dark:bg-white/5 shrink-0 z-20 relative">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2">Schedule Overview</span>
           </div>

           {/* Scrollable Timeline Area */}
           <div 
             ref={timelineRef}
             className={`flex-1 overflow-auto custom-scrollbar relative select-none ${isDraggingOverTimeline ? 'bg-blue-50/30 dark:bg-blue-900/5 ring-2 ring-inset ring-blue-500/30' : ''}`} 
             style={{ scrollBehavior: 'smooth' }}
             onDragOver={handleTimelineDragOver}
             onDragLeave={handleTimelineDragLeave}
             onDrop={handleTimelineDrop}
           >
              <div 
                className="relative min-w-full" 
                style={{ 
                  width: `${(totalViewDurationMs / 60000) * pixelsPerMinute}px`,
                  height: `${CONTAINER_HEIGHT}px`
                }}
              >
                
                {/* 15 Minute Grid */}
                {Array.from({ length: Math.ceil((totalViewDurationMs / 60000) / 15) }).map((_, i) => {
                   const time = new Date(viewStart + i * 15 * 60000);
                   const minutes = time.getMinutes();
                   const remainder = minutes % 15;
                   const roundedTime = new Date(time.getTime() - remainder * 60000);
                   const left = getPosition(roundedTime);
                   
                   return (
                     <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-100 dark:border-white/5 flex flex-col justify-end pb-2 pl-1 pointer-events-none" style={{ left: `${left}px` }}>
                       <span className="sticky bottom-2 text-[10px] text-zinc-300 dark:text-zinc-600 font-mono">{formatTime(roundedTime)}</span>
                     </div>
                   );
                })}

                {/* Current Time Line */}
                <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none" style={{ left: `${getPosition(currentTime)}px` }}>
                   <div className="sticky top-0 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1 rounded-b font-bold shadow-sm w-fit mx-auto">NOW</div>
                </div>

                {/* Drop Guide Line (Snap Preview) */}
                {isDraggingOverTimeline && dragPreviewTime && (
                   <div 
                     className="absolute top-0 bottom-0 border-l-2 border-dashed border-blue-400 z-30 pointer-events-none animate-pulse flex flex-col justify-center pl-1"
                     style={{ left: `${getPosition(dragPreviewTime)}px` }}
                   >
                      <span className="sticky top-1/2 bg-blue-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap w-fit">
                        {formatTime(dragPreviewTime)}
                      </span>
                   </div>
                )}

                {/* Items */}
                <div className="absolute top-4 left-0 right-0 bottom-0">
                   {rowItems.map((item) => (
                     <div 
                        key={`${item.type}-${item.id}`}
                        draggable={item.isDraggable}
                        onDragStart={(e) => item.isDraggable && handleDragStart(e, item.id, 'timer')}
                        className={`
                          absolute h-11 rounded-lg flex items-center px-3 gap-2 border shadow-sm transition-all 
                          ${item.bgClass}
                          ${item.isDraggable ? 'active:cursor-grabbing active:scale-[1.02] active:shadow-md z-10' : 'z-0'}
                        `}
                        style={{ 
                          left: `${getPosition(item.start)}px`,
                          top: `${item.rowIndex * ROW_HEIGHT}px`,
                          width: `${Math.max(60, item.durationMinutes * pixelsPerMinute)}px`
                        }}
                     >
                        <div className={`w-1.5 h-1.5 rounded-full ${item.colorClass} ${!item.isScheduled && item.start.getTime() <= now && item.end.getTime() > now ? 'animate-pulse' : ''} shrink-0`} />
                        <div className="flex flex-col min-w-0 overflow-hidden leading-tight">
                          <span className={`text-xs font-semibold truncate ${item.isScheduled ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{item.label}</span>
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                             {item.isScheduled && <CalendarClock className="w-3 h-3" />}
                             {getDisplayText(item)}
                          </span>
                        </div>
                        
                        {/* Progress Bar inside */}
                        {item.progress > 0 && !item.isScheduled && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 overflow-hidden rounded-b-lg">
                            <div className={`h-full ${item.colorClass} transition-all duration-1000`} style={{ width: `${item.progress}%` }} />
                          </div>
                        )}

                        {/* Drag Handle hint for hover */}
                        {item.isDraggable && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">
                             <GripVertical className="w-3 h-3 text-zinc-400" />
                          </div>
                        )}
                        
                        {/* Reset button for running timers */}
                        {item.type === 'timer' && (
                          <button 
                             onClick={(e) => { e.stopPropagation(); handleReset(timers.find(t => t.id === item.id)!); }}
                             className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-full p-0.5 shadow-sm border border-zinc-200 dark:border-zinc-700 opacity-0 hover:opacity-100 transition-opacity"
                             title="Remove from timeline"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                     </div>
                   ))}
                </div>

              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

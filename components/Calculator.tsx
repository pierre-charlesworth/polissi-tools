import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorState, CalculationResult, GrowthDataPoint } from '../types';
import { FlaskConical, Clock, Droplets, AlertCircle, Play, RotateCcw, Timer, Info, Hourglass, HelpCircle } from 'lucide-react';
import { GrowthChart } from './GrowthChart';

// Standard carrying capacity for E. coli in LB media (approximate OD600)
// We will adjust this dynamically if the user targets a higher OD.
const DEFAULT_CARRYING_CAPACITY = 4.0;

interface CalculatorProps {
  isDarkMode: boolean;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle normal-case">
    <div className="cursor-help opacity-40 hover:opacity-100 transition-opacity">
      <HelpCircle className="w-3.5 h-3.5" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-zinc-800 dark:bg-zinc-700 text-zinc-100 text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center font-sans font-normal leading-relaxed border border-zinc-700 dark:border-zinc-600">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700"></div>
    </div>
  </div>
);

export const Calculator: React.FC<CalculatorProps> = ({ isDarkMode }) => {
  const [state, setState] = useState<CalculatorState>({
    inoculumOD: '2.5',
    targetVolume: '500',
    targetStartOD: '0.1',
    targetHarvestOD: '0.8',
    doublingTime: '20',
    lagTime: '20',
    calculationMode: 'total_volume',
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Tracking state
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);

  // Update clock every second for timer accuracy
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (field: keyof CalculatorState, value: string | 'total_volume' | 'fixed_media') => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handleStartTracking = () => {
    setTrackingStartTime(new Date());
  };

  const handleResetTracking = () => {
    setTrackingStartTime(null);
  };

  // Helper to format volume
  const formatVolume = (volInMl: number) => {
    if (volInMl < 1) {
      return { 
        value: (volInMl * 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }), 
        unit: 'µL',
        isMicroliter: true
      };
    }
    return { 
      value: volInMl.toLocaleString(undefined, { maximumFractionDigits: 2 }), 
      unit: 'mL',
      isMicroliter: false
    };
  };

  // Determine Carrying Capacity (K)
  const carryingCapacity = useMemo(() => {
    const harvestOD = parseFloat(String(state.targetHarvestOD)) || 0;
    return Math.max(DEFAULT_CARRYING_CAPACITY, harvestOD * 1.2);
  }, [state.targetHarvestOD]);

  // Main Calculation Logic
  const results: CalculationResult = useMemo(() => {
    const inocOD = parseFloat(String(state.inoculumOD));
    const inputVol = parseFloat(String(state.targetVolume));
    const startOD = parseFloat(String(state.targetStartOD));
    const harvestOD = parseFloat(String(state.targetHarvestOD));
    const doubleTime = parseFloat(String(state.doublingTime));
    const lagTime = parseFloat(String(state.lagTime)) || 0;

    if (
      isNaN(inocOD) || isNaN(inputVol) || isNaN(startOD) || 
      isNaN(harvestOD) || isNaN(doubleTime) || 
      inocOD <= 0 || inputVol <= 0 || startOD <= 0 || doubleTime <= 0
    ) {
      return { 
        inoculumVolume: 0, 
        mediaVolume: 0, 
        minutesToHarvest: 0, 
        harvestDate: null, 
        isValid: false 
      };
    }

    // 1. Dilution Calculation
    let v1 = 0; // Inoculum Volume
    let vMedia = 0; // Media Volume
    let calculationError = undefined;

    if (state.calculationMode === 'fixed_media') {
      // Logic: Add inoculum TO the fixed media volume
      // C1*V1 = C_final * (V_media + V1)
      // V1 = (C_final * V_media) / (C1 - C_final)
      if (inocOD <= startOD) {
        calculationError = "Inoculum OD must be greater than Start OD for this mode.";
      } else {
        vMedia = inputVol;
        v1 = (startOD * vMedia) / (inocOD - startOD);
      }
    } else {
      // Logic: Reach Total Volume (Classic Dilution)
      // C1*V1 = C2*V2
      // V1 = (C2 * V2) / C1
      v1 = (startOD * inputVol) / inocOD;
      vMedia = inputVol - v1;
      
      if (v1 > inputVol) {
        calculationError = "Inoculum volume exceeds target volume. Inoculum OD is too low.";
      }
    }

    // 2. Growth Calculation (Logistic Model with Lag)
    let totalMinutes = 0;
    
    // Check if harvest OD is physically possible within K
    if (harvestOD >= carryingCapacity) {
      calculationError = `Target OD (${harvestOD}) exceeds estimated carrying capacity (${carryingCapacity.toFixed(1)}).`;
    }

    if (!calculationError && harvestOD > startOD) {
      const mu = Math.log(2) / doubleTime; // Specific growth rate
      
      const numerator = (carryingCapacity / harvestOD) - 1;
      const denominator = (carryingCapacity / startOD) - 1;
      
      if (numerator > 0 && denominator > 0) {
         // Growth time
         const growthMinutes = -(1 / mu) * Math.log(numerator / denominator);
         // Total time includes lag
         totalMinutes = lagTime + growthMinutes;
      } else {
        totalMinutes = 0;
      }
    }

    // If tracking, harvest date is relative to start time, otherwise relative to now
    const baseTime = trackingStartTime || currentTime;
    const harvestDate = new Date(baseTime.getTime() + totalMinutes * 60000);

    return {
      inoculumVolume: v1,
      mediaVolume: vMedia,
      minutesToHarvest: totalMinutes,
      harvestDate,
      isValid: !calculationError,
      error: calculationError
    };
  }, [state, currentTime, trackingStartTime, carryingCapacity]);

  // Tracking calculations (Logistic with Lag)
  const trackingStatus = useMemo(() => {
    if (!trackingStartTime || !results.isValid) return null;
    
    const elapsedMs = currentTime.getTime() - trackingStartTime.getTime();
    const elapsedMinutes = elapsedMs / 60000;
    
    const startOD = parseFloat(String(state.targetStartOD));
    const doubleTime = parseFloat(String(state.doublingTime));
    const lagTime = parseFloat(String(state.lagTime)) || 0;
    
    let currentOD = startOD;

    // Logic for Lag Phase vs Growth Phase
    if (elapsedMinutes > lagTime) {
      const growthTime = elapsedMinutes - lagTime;
      const mu = Math.log(2) / doubleTime;
      const K = carryingCapacity;
      
      // Logistic function based on time spent GROWING (t - lag)
      currentOD = (K * startOD) / (startOD + (K - startOD) * Math.exp(-mu * growthTime));
    }
    
    return {
      elapsedMinutes,
      currentOD,
      formattedTime: new Date(elapsedMs).toISOString().slice(11, 19) // HH:MM:SS
    };
  }, [trackingStartTime, currentTime, results.isValid, state.targetStartOD, state.doublingTime, state.lagTime, carryingCapacity]);

  // Calculate stationary phase start time (approx 95% of K) for chart visualization
  const stationaryPhaseStartTime = useMemo(() => {
    if (!results.isValid) return 0;
    const startOD = parseFloat(String(state.targetStartOD));
    const doubleTime = parseFloat(String(state.doublingTime));
    const lagTime = parseFloat(String(state.lagTime)) || 0;
    const K = carryingCapacity;
    const mu = Math.log(2) / doubleTime;

    // Solve for t where OD = 0.95 * K
    try {
      const term95 = (1/0.95) - 1; 
      const termStart = (K/startOD) - 1;
      const timeToSaturation = -(1/mu) * Math.log(term95 / termStart);
      return lagTime + Math.max(0, timeToSaturation);
    } catch {
      return 0;
    }
  }, [results.isValid, state.targetStartOD, state.doublingTime, state.lagTime, carryingCapacity]);

  // Generate Data Points for Chart (Logistic Curve with Lag)
  const chartData: GrowthDataPoint[] = useMemo(() => {
    if (!results.isValid) return [];

    const startOD = parseFloat(String(state.targetStartOD));
    const doubleTime = parseFloat(String(state.doublingTime));
    const lagTime = parseFloat(String(state.lagTime)) || 0;
    const harvestTime = results.minutesToHarvest;
    const K = carryingCapacity;
    const mu = Math.log(2) / doubleTime;

    // Determine chart max time
    // Should show: Lag -> Harvest -> Stationary
    let maxTime = Math.max(harvestTime * 1.5, stationaryPhaseStartTime * 1.1);
    
    // Safety caps
    maxTime = Math.max(maxTime, 120); // Min 2 hours
    maxTime = Math.min(maxTime, 48 * 60); // Max 48 hours

    if (trackingStatus && trackingStatus.elapsedMinutes > maxTime) {
      maxTime = trackingStatus.elapsedMinutes * 1.1;
    }
      
    const pointsCount = 100;
    const step = maxTime / pointsCount;

    const points: GrowthDataPoint[] = [];
    for (let t = 0; t <= maxTime; t += step) {
      let od = startOD;
      if (t > lagTime) {
        const growthT = t - lagTime;
        od = (K * startOD) / (startOD + (K - startOD) * Math.exp(-mu * growthT));
      }
      points.push({ time: t, od: od });
    }
    return points;
  }, [results, state.targetStartOD, state.doublingTime, state.lagTime, trackingStatus, carryingCapacity, stationaryPhaseStartTime]);

  const inocVol = formatVolume(results.inoculumVolume);
  const mediaVol = formatVolume(results.mediaVolume);
  const totalVol = formatVolume(results.mediaVolume + results.inoculumVolume);
  const lagTimeVal = parseFloat(String(state.lagTime)) || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      <div className="grid md:grid-cols-2 gap-8">
        {/* INPUT CARD */}
        <div className="bg-white dark:bg-lab-card rounded-md border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300 relative">
          <div className="bg-zinc-50 dark:bg-white/5 px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex items-center gap-3 transition-colors duration-300 rounded-t-md">
            <FlaskConical className="text-emerald-600 dark:text-emerald-500 w-5 h-5" />
            <h2 className="text-lg font-medium font-sans tracking-wide text-zinc-900 dark:text-zinc-100">Parameters</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Dilution Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest flex items-center">
                  Dilution Setup
                  <InfoTooltip text="Configure how you want to prepare your culture." />
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="space-y-2">
                <div className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded border border-zinc-200 dark:border-white/5 flex transition-colors duration-300">
                  <button
                    className={`flex-1 py-2 text-xs font-medium rounded-sm transition-all duration-300 ${state.calculationMode === 'total_volume' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    onClick={() => handleChange('calculationMode', 'total_volume')}
                    disabled={!!trackingStartTime}
                  >
                    Target Total Vol
                  </button>
                  <button
                     className={`flex-1 py-2 text-xs font-medium rounded-sm transition-all duration-300 ${state.calculationMode === 'fixed_media' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                     onClick={() => handleChange('calculationMode', 'fixed_media')}
                     disabled={!!trackingStartTime}
                  >
                    Add to Media
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 px-1">
                  {state.calculationMode === 'total_volume' 
                    ? 'Calculates Media + Inoculum to reach exactly the target volume.'
                    : 'Calculates Inoculum to add ON TOP of a fixed media volume.'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center">
                    Inoculum OD₆₀₀
                    <InfoTooltip text="Optical Density (OD600) of your overnight or starter culture." />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!!trackingStartTime}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                    value={state.inoculumOD}
                    onChange={(e) => handleChange('inoculumOD', e.target.value)}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 truncate flex items-center">
                    {state.calculationMode === 'total_volume' ? 'Target Total (mL)' : 'Fixed Media (mL)'}
                  </label>
                  <input
                    type="number"
                    disabled={!!trackingStartTime}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                    value={state.targetVolume}
                    onChange={(e) => handleChange('targetVolume', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center">
                  Desired Start OD₆₀₀
                  <InfoTooltip text="The target OD600 immediately after mixing media and inoculum." />
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!!trackingStartTime}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                  value={state.targetStartOD}
                  onChange={(e) => handleChange('targetStartOD', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-white/5 pt-8 space-y-6 transition-colors duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                   Growth Prediction
                   <InfoTooltip text="Parameters to simulate the growth curve and estimate harvest time." />
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center">
                    Harvest OD
                    <InfoTooltip text="The target OD for harvesting. Determines calculation of carrying capacity (K)." />
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!!trackingStartTime}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                    value={state.targetHarvestOD}
                    onChange={(e) => handleChange('targetHarvestOD', e.target.value)}
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center">
                    Doubling Time
                    <InfoTooltip text="Time (in minutes) for the population to double during exponential growth." />
                  </label>
                  <input
                    type="number"
                    disabled={!!trackingStartTime}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                    value={state.doublingTime}
                    onChange={(e) => handleChange('doublingTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Lag Time Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-2">
                   Lag Phase Duration (min)
                   <InfoTooltip text="Estimated time before exponential growth begins. Culture density remains constant." />
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hourglass className="h-4 w-4 text-zinc-600 dark:text-zinc-600" />
                  </div>
                  <input
                    type="number"
                    disabled={!!trackingStartTime}
                    className="w-full pl-9 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50"
                    value={state.lagTime}
                    onChange={(e) => handleChange('lagTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-500 bg-zinc-50 dark:bg-white/5 p-3 rounded-sm border border-zinc-200 dark:border-white/5 transition-colors duration-300">
                 <Info className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
                 <p className="flex items-center gap-1">
                   Model assumes {lagTimeVal}m lag phase followed by Logistic growth (Carrying Capacity K={carryingCapacity.toFixed(1)}
                   <InfoTooltip text="Carrying Capacity (K) is the maximum population density the environment can support. Growth rate slows as OD approaches K." />
                   ).
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS CARD */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-lab-card rounded-md border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 p-6 relative overflow-hidden group shadow-sm dark:shadow-none transition-colors duration-300">
             
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-8 text-emerald-600 dark:text-emerald-500">
                 <Droplets className="w-5 h-5" />
                 <h2 className="text-lg font-medium font-sans tracking-wide text-zinc-900 dark:text-zinc-100">Protocol Recipe</h2>
               </div>

               {results.isValid && !results.error ? (
                 <div className="space-y-8">
                    {/* Media Display - Swapped for Fixed Media Mode */}
                    <div className="flex items-end justify-between border-b border-zinc-200 dark:border-white/5 pb-4 transition-colors duration-300">
                      <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        {state.calculationMode === 'fixed_media' ? 'Use Base Media' : 'Add Fresh Media'}
                      </span>
                      <div className="text-right">
                        <span className="text-3xl font-medium text-zinc-900 dark:text-white font-mono tracking-tight transition-colors duration-300">
                          {mediaVol.value}
                        </span>
                        <span className="text-sm ml-1 text-zinc-500 font-medium">{mediaVol.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Add Inoculum</span>
                      <div className="text-right">
                        <span className="text-4xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight transition-colors duration-300">
                          {inocVol.value}
                        </span>
                        <span className="text-sm ml-1 text-zinc-500 font-medium">{inocVol.unit}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-white/10 flex justify-between items-center text-sm text-zinc-500 transition-colors duration-300">
                      <span className="uppercase tracking-wider text-xs">Final Total Volume</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {totalVol.value} {totalVol.unit}
                      </span>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-48 text-zinc-500 dark:text-zinc-600">
                    <AlertCircle className="w-6 h-6 mb-3 opacity-30" />
                    <p className="text-center text-sm tracking-wider uppercase">{results.error || "Enter valid parameters"}</p>
                 </div>
               )}
             </div>
          </div>

          <div className="bg-white dark:bg-lab-card rounded-md border border-zinc-200 dark:border-white/10 p-6 flex flex-col justify-between h-auto min-h-[200px] shadow-sm dark:shadow-none transition-colors duration-300">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                  <Clock className="w-5 h-5" />
                  <h2 className="text-lg font-medium font-sans tracking-wide text-zinc-900 dark:text-zinc-100">Time Course</h2>
                </div>
                {trackingStartTime && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Running
                  </div>
                )}
              </div>

              {results.isValid && results.minutesToHarvest > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-sm border border-zinc-200 dark:border-white/5 transition-colors duration-300">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">
                        {trackingStartTime ? 'Total Duration' : 'Time to Harvest'}
                      </p>
                      <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100 font-mono">
                        {Math.floor(results.minutesToHarvest / 60)}<span className="text-base text-zinc-500 dark:text-zinc-600">h</span> 
                        {' '}{Math.round(results.minutesToHarvest % 60)}<span className="text-base text-zinc-500 dark:text-zinc-600">m</span>
                      </p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-sm border border-zinc-200 dark:border-white/5 transition-colors duration-300">
                      <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Completion</p>
                      <p className="text-2xl font-light text-zinc-900 dark:text-zinc-100 font-mono">
                        {results.harvestDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 uppercase tracking-wide">
                        {results.harvestDate && results.harvestDate.getDate() !== (trackingStartTime || currentTime).getDate() ? 'Tomorrow' : 'Today'}
                      </p>
                    </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 dark:text-zinc-600 py-4 text-xs tracking-wider uppercase">
                  {results.isValid ? "Set Harvest OD > Start OD" : "Awaiting Parameters"}
                </div>
              )}
            </div>

            {/* Tracking Controls */}
            {results.isValid && results.minutesToHarvest > 0 && (
              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-white/5 transition-colors duration-300">
                {!trackingStartTime ? (
                  <button
                    onClick={handleStartTracking}
                    className="w-full py-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-black rounded-sm font-medium text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Timer
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white p-4 rounded-sm font-mono transition-colors duration-300">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider">
                        <Timer className="w-3 h-3" />
                        Elapsed
                      </div>
                      <div className="text-xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {trackingStatus?.formattedTime}
                      </div>
                    </div>
                    <button
                      onClick={handleResetTracking}
                      className="w-full py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-sm font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {results.isValid && results.minutesToHarvest > 0 && (
         <GrowthChart 
           data={chartData} 
           startOD={parseFloat(String(state.targetStartOD))}
           targetOD={parseFloat(String(state.targetHarvestOD))}
           harvestPoint={{ time: results.minutesToHarvest, od: parseFloat(String(state.targetHarvestOD)) }}
           currentPoint={trackingStatus ? { time: trackingStatus.elapsedMinutes, od: trackingStatus.currentOD } : undefined}
           phases={{
             lagDuration: lagTimeVal,
             stationaryStart: stationaryPhaseStartTime
           }}
           isDarkMode={isDarkMode}
         />
      )}
    </div>
  );
};
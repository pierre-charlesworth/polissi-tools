
import { CalculatorState, CalculationResult, TrackingStatus, GrowthDataPoint } from '../types';

export const DEFAULT_CARRYING_CAPACITY = 4.0;

export const calculateCarryingCapacity = (targetHarvestOD: string | number) => {
  const harvestOD = parseFloat(String(targetHarvestOD)) || 0;
  return Math.max(DEFAULT_CARRYING_CAPACITY, harvestOD * 1.2);
};

export const calculateResults = (
  state: CalculatorState, 
  trackingStartTime: number | null, 
  currentTime: Date
): CalculationResult => {
  const inocOD = parseFloat(String(state.inoculumOD));
  const inputVol = parseFloat(String(state.targetVolume));
  const startOD = parseFloat(String(state.targetStartOD));
  const harvestOD = parseFloat(String(state.targetHarvestOD));
  const doubleTime = parseFloat(String(state.doublingTime));
  const lagTime = parseFloat(String(state.lagTime)) || 0;
  const carryingCapacity = calculateCarryingCapacity(state.targetHarvestOD);

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
      isValid: false,
      carryingCapacity
    };
  }

  // 1. Dilution Calculation
  let v1 = 0; // Inoculum Volume
  let vMedia = 0; // Media Volume
  let calculationError = undefined;

  if (state.calculationMode === 'fixed_media') {
    if (inocOD <= startOD) {
      calculationError = "Inoculum OD must be greater than Start OD.";
    } else {
      vMedia = inputVol;
      v1 = (startOD * vMedia) / (inocOD - startOD);
    }
  } else {
    v1 = (startOD * inputVol) / inocOD;
    vMedia = inputVol - v1;
    
    if (v1 > inputVol) {
      calculationError = "Inoculum volume > target.";
    }
  }

  // 2. Growth Calculation (Logistic Model with Lag)
  let totalMinutes = 0;
  
  if (harvestOD >= carryingCapacity) {
    calculationError = `Target OD > Capacity (${carryingCapacity.toFixed(1)}).`;
  }

  if (!calculationError && harvestOD > startOD) {
    const mu = Math.log(2) / doubleTime; // Specific growth rate
    
    const numerator = (carryingCapacity / harvestOD) - 1;
    const denominator = (carryingCapacity / startOD) - 1;
    
    if (numerator > 0 && denominator > 0) {
       const growthMinutes = -(1 / mu) * Math.log(numerator / denominator);
       totalMinutes = lagTime + growthMinutes;
    }
  }

  const baseTime = trackingStartTime ? new Date(trackingStartTime) : currentTime;
  const harvestDate = new Date(baseTime.getTime() + totalMinutes * 60000);

  return {
    inoculumVolume: v1,
    mediaVolume: vMedia,
    minutesToHarvest: totalMinutes,
    harvestDate,
    isValid: !calculationError,
    error: calculationError,
    carryingCapacity
  };
};

export const calculateTracking = (
  state: CalculatorState,
  trackingStartTime: number | null,
  currentTime: Date,
  results: CalculationResult
): TrackingStatus | null => {
  if (!trackingStartTime || !results.isValid) return null;
  
  const elapsedMs = currentTime.getTime() - trackingStartTime;
  const elapsedMinutes = elapsedMs / 60000;
  
  const startOD = parseFloat(String(state.targetStartOD));
  const doubleTime = parseFloat(String(state.doublingTime));
  const lagTime = parseFloat(String(state.lagTime)) || 0;
  const K = results.carryingCapacity;
  
  let currentOD = startOD;

  if (elapsedMinutes > lagTime) {
    const growthTime = elapsedMinutes - lagTime;
    const mu = Math.log(2) / doubleTime;
    currentOD = (K * startOD) / (startOD + (K - startOD) * Math.exp(-mu * growthTime));
  }

  // Cap OD at K to prevent weird overshoot numbers
  if (currentOD > K) currentOD = K;
  
  const totalDuration = results.minutesToHarvest;
  const completionPercentage = totalDuration > 0 ? Math.min(100, (elapsedMinutes / totalDuration) * 100) : 0;

  return {
    elapsedMinutes,
    currentOD,
    formattedTime: new Date(elapsedMs).toISOString().slice(11, 19),
    completionPercentage
  };
};

export const generateChartData = (
  state: CalculatorState,
  results: CalculationResult,
  trackingStatus: TrackingStatus | null
): { data: GrowthDataPoint[], stationaryStart: number } => {
  if (!results.isValid) return { data: [], stationaryStart: 0 };

  const startOD = parseFloat(String(state.targetStartOD));
  const doubleTime = parseFloat(String(state.doublingTime));
  const lagTime = parseFloat(String(state.lagTime)) || 0;
  const harvestTime = results.minutesToHarvest;
  const K = results.carryingCapacity;
  const mu = Math.log(2) / doubleTime;

  // Stationary start (approx 95% of K)
  let stationaryStart = 0;
  try {
    const term95 = (1/0.95) - 1; 
    const termStart = (K/startOD) - 1;
    const timeToSaturation = -(1/mu) * Math.log(term95 / termStart);
    stationaryStart = lagTime + Math.max(0, timeToSaturation);
  } catch {
    stationaryStart = harvestTime * 1.2;
  }

  let maxTime = Math.max(harvestTime * 1.5, stationaryStart * 1.1);
  maxTime = Math.max(maxTime, 120); 
  maxTime = Math.min(maxTime, 48 * 60); 

  if (trackingStatus && trackingStatus.elapsedMinutes > maxTime) {
    maxTime = trackingStatus.elapsedMinutes * 1.1;
  }
    
  const pointsCount = 60; // Reduced for performance
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
  return { data: points, stationaryStart };
};

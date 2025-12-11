
export interface CalculatorState {
  inoculumOD: number | string;
  targetVolume: number | string;
  targetStartOD: number | string;
  targetHarvestOD: number | string;
  doublingTime: number | string; // in minutes
  lagTime: number | string; // in minutes
  calculationMode: 'total_volume' | 'fixed_media';
}

export interface Experiment extends CalculatorState {
  id: string;
  name: string;
  trackingStartTime: number | null; // timestamp in ms
  createdAt: number;
}

export interface CalculationResult {
  inoculumVolume: number; // mL
  mediaVolume: number; // mL
  minutesToHarvest: number;
  harvestDate: Date | null;
  isValid: boolean;
  error?: string;
  carryingCapacity: number;
}

export interface GrowthDataPoint {
  time: number; // minutes
  od: number;
}

export interface TrackingStatus {
  elapsedMinutes: number;
  currentOD: number;
  formattedTime: string;
  completionPercentage: number;
}

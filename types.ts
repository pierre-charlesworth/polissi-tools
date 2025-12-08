export interface CalculatorState {
  inoculumOD: number | string;
  targetVolume: number | string;
  targetStartOD: number | string;
  targetHarvestOD: number | string;
  doublingTime: number | string; // in minutes
  lagTime: number | string; // in minutes
  calculationMode: 'total_volume' | 'fixed_media';
}

export interface CalculationResult {
  inoculumVolume: number; // mL
  mediaVolume: number; // mL
  minutesToHarvest: number;
  harvestDate: Date | null;
  isValid: boolean;
  error?: string;
}

export interface GrowthDataPoint {
  time: number; // minutes
  od: number;
}
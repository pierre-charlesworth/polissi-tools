
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

export interface StandaloneTimer {
  id: string;
  label: string;
  durationMinutes: number;
  startTime: number | null; // timestamp when started
  pausedTimeRemaining: number | null; // if paused, how much is left
  status: 'idle' | 'running' | 'paused' | 'completed';
  createdAt: number;
}

export type StepActionType = 'timer' | 'experiment';

export interface StepAction {
  type: StepActionType;
  // For timers
  durationMinutes?: number;
  timerLabel?: string;
  // For experiments
  experimentConfig?: Partial<Experiment>;
}

export interface ProtocolStep {
  id: string;
  text: string;
  isCompleted: boolean;
  action?: StepAction;
  activeTimerId?: string;
}

export interface Protocol {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  steps: ProtocolStep[];
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

export type View = 'dashboard' | 'calculator' | 'experiments' | 'timers' | 'protocols' | 'settings';

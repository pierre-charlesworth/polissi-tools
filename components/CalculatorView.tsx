
import React from 'react';
import { Calculator } from './Calculator';
import { Experiment } from '../types';

interface CalculatorViewProps {
  experiment: Experiment;
  onUpdate: (updates: Partial<Experiment>) => void;
  isDarkMode: boolean;
  currentTime: Date;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({ 
  experiment, 
  onUpdate, 
  isDarkMode, 
  currentTime 
}) => {
  return (
    <div className="w-full px-4 pt-6 sm:pt-8 pb-32 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <Calculator 
        experiment={experiment} 
        onUpdate={onUpdate}
        isDarkMode={isDarkMode}
        currentTime={currentTime}
      />
    </div>
  );
};


import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, ReferenceLine } from 'recharts';
import { GrowthDataPoint } from '../types';

interface MiniGrowthChartProps {
  data: GrowthDataPoint[];
  currentOD?: number;
  targetOD: number;
  harvestTime?: number;
  isDarkMode: boolean;
}

export const MiniGrowthChart: React.FC<MiniGrowthChartProps> = ({ data, currentOD, targetOD, harvestTime, isDarkMode }) => {
  const lineColor = isDarkMode ? '#10b981' : '#059669';
  const trackColor = isDarkMode ? '#3f3f46' : '#e4e4e7';
  const harvestLineColor = isDarkMode ? '#10b981' : '#059669';

  return (
    <div className="h-full w-full pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis type="number" dataKey="time" hide domain={[0, 'dataMax']} />
          <YAxis domain={[0, 'auto']} hide />
          
          {/* Target OD Line (Horizontal) */}
          <ReferenceLine y={targetOD} stroke={trackColor} strokeDasharray="2 2" />
          
          {/* Harvest Time Line (Vertical) */}
          {harvestTime !== undefined && (
             <ReferenceLine 
               x={harvestTime} 
               stroke={harvestLineColor} 
               strokeOpacity={1}
               strokeWidth={2}
               strokeDasharray="3 3" 
             />
          )}

          <Line
            type="monotone"
            dataKey="od"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

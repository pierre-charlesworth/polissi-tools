
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  ReferenceDot,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { GrowthDataPoint } from '../types';

interface GrowthChartProps {
  data: GrowthDataPoint[];
  targetOD: number;
  startOD: number;
  currentPoint?: { time: number; od: number };
  harvestPoint?: { time: number; od: number };
  phases?: {
    lagDuration: number;
    stationaryStart: number;
  };
  isDarkMode: boolean;
}

// Custom rendered dot for the pulsing effect
const PulsingDot = (props: any) => {
  const { cx, cy } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r="10" fill="rgba(16, 185, 129, 0.2)">
        <animate attributeName="r" from="6" to="14" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="4" fill="#10b981" stroke="currentColor" strokeWidth="1.5" />
    </g>
  );
};

export const GrowthChart: React.FC<GrowthChartProps> = ({ data, targetOD, startOD, currentPoint, harvestPoint, phases, isDarkMode }) => {
  if (data.length === 0) return null;

  // Theme constants
  const axisColor = isDarkMode ? '#52525b' : '#71717a';
  const gridColor = isDarkMode ? '#27272a' : '#e4e4e7';
  const textColor = isDarkMode ? '#e4e4e7' : '#18181b';
  const tooltipBg = isDarkMode ? '#18181b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#27272a' : '#e4e4e7';
  const lineColor = isDarkMode ? '#f4f4f5' : '#18181b';
  
  // Phase colors (with transparency in JSX)
  const lagFill = isDarkMode ? '#ffffff' : '#000000';
  const lagOpacity = isDarkMode ? 0.02 : 0.03;
  
  // Exponential phase - Grey/Neutral
  const expFill = isDarkMode ? '#a1a1aa' : '#71717a'; 
  const expOpacity = isDarkMode ? 0.05 : 0.05;
  
  const stnFill = isDarkMode ? '#ffffff' : '#000000';
  const stnOpacity = isDarkMode ? 0.05 : 0.05;

  return (
    <div className="w-full h-96 bg-white dark:bg-lab-card rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shadow-sm dark:shadow-2xl dark:shadow-black/20 transition-colors duration-300 flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0 px-1">
        <h3 className="text-lg font-medium font-sans text-zinc-900 dark:text-zinc-100 tracking-wide">Growth Trajectory</h3>
        <div className="flex items-center gap-4">
          {harvestPoint && (
             <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-2 py-1 rounded-sm flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               TARGET: OD {harvestPoint.od.toFixed(2)}
             </div>
          )}
          {currentPoint && (
             <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded-sm flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               CURRENT: OD {currentPoint.od.toFixed(3)}
             </div>
          )}
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 5, 
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            
            {/* Phase Backgrounds */}
            {phases && (
              <>
                {/* Lag Phase */}
                {phases.lagDuration > 0 && (
                  <ReferenceArea 
                    x1={0} 
                    x2={phases.lagDuration} 
                    fill={lagFill} 
                    fillOpacity={lagOpacity}
                  >
                    <Label value="LAG" position="insideTop" fill={axisColor} fontSize={10} fontWeight={600} offset={10} style={{ letterSpacing: '0.1em' }} />
                  </ReferenceArea>
                )}

                {/* Exponential Phase */}
                <ReferenceArea 
                  x1={phases.lagDuration} 
                  x2={phases.stationaryStart} 
                  fill={expFill} 
                  fillOpacity={expOpacity}
                >
                   <Label value="EXP" position="insideTop" fill={axisColor} fontSize={10} fontWeight={600} offset={10} style={{ letterSpacing: '0.1em', opacity: 0.8 }} />
                </ReferenceArea>

                {/* Stationary Phase */}
                <ReferenceArea 
                  x1={phases.stationaryStart} 
                  fill={stnFill} 
                  fillOpacity={stnOpacity}
                >
                  <Label value="STN" position="insideTop" fill={axisColor} fontSize={10} fontWeight={600} offset={10} style={{ letterSpacing: '0.1em' }} />
                </ReferenceArea>
              </>
            )}

            <XAxis 
              type="number"
              dataKey="time" 
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax']}
              tickFormatter={(val) => `${Math.floor(val / 60)}h${val % 60 > 0 ? `${Math.round(val % 60)}` : ''}`}
              minTickGap={40}
              dy={10}
              height={30}
            />
            <YAxis 
              stroke={axisColor} 
              tick={{ fill: axisColor, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
              width={40}
            >
              <Label value="OD600" angle={-90} position="insideLeft" style={{ fill: axisColor, fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em' }} dx={0} />
            </YAxis>
            <Tooltip 
              contentStyle={{ backgroundColor: tooltipBg, borderRadius: '4px', border: `1px solid ${tooltipBorder}`, color: textColor }}
              itemStyle={{ color: textColor, fontFamily: 'JetBrains Mono', fontSize: '12px' }}
              formatter={(value: number) => [value.toFixed(3), 'OD600']}
              labelFormatter={(label: number) => {
                const h = Math.floor(label / 60);
                const m = Math.round(label % 60);
                return `${h}h ${m}m`;
              }}
              cursor={{ stroke: axisColor, strokeWidth: 1 }}
            />
            
            <Line
              type="monotone"
              dataKey="od"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: tooltipBg, stroke: lineColor }}
              animationDuration={500}
              isAnimationActive={true}
            />

            {harvestPoint && (
              <ReferenceLine 
                key={`harvest-time-${harvestPoint.time}`}
                x={harvestPoint.time} 
                stroke="#10b981" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
                isFront={true}
                label={{ 
                  value: 'HARVEST', 
                  position: 'insideTopRight', 
                  fill: '#10b981', 
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em'
                }} 
              />
            )}
            
            {harvestPoint && (
               <ReferenceLine 
                 key={`harvest-od-${harvestPoint.od}`}
                 y={harvestPoint.od} 
                 stroke="#10b981" 
                 strokeDasharray="3 3"
                 strokeOpacity={0.5}
                 isFront={true}
               />
            )}

            {harvestPoint && (
               <ReferenceDot
                 key={`harvest-dot-${harvestPoint.time}-${harvestPoint.od}`}
                 x={harvestPoint.time}
                 y={harvestPoint.od}
                 r={3}
                 fill={isDarkMode ? "#09090b" : "#ffffff"}
                 stroke="#10b981"
                 strokeWidth={2}
                 isFront={true}
               />
            )}

            {currentPoint && (
              <ReferenceDot 
                key={`current-dot-${currentPoint.time}`}
                x={currentPoint.time} 
                y={currentPoint.od} 
                shape={<PulsingDot />}
                isFront={true}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

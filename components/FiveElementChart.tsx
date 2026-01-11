import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

// Mock data for the prototype
const data = [
  { subject: '金 (Metal)', A: 20, fullMark: 100 },
  { subject: '水 (Water)', A: 10, fullMark: 100 },
  { subject: '木 (Wood)', A: 40, fullMark: 100 },
  { subject: '火 (Fire)', A: 20, fullMark: 100 },
  { subject: '土 (Earth)', A: 10, fullMark: 100 },
];

export const FiveElementChart: React.FC = () => {
  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 50]} tick={false} axisLine={false} />
          <Radar
            name="Energy"
            dataKey="A"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="#8b5cf6"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
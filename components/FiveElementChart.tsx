import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { FiveElementScore } from '../utils/baziLogic';

interface Props {
  scores: FiveElementScore;
}

export const FiveElementChart: React.FC<Props> = ({ scores }) => {
  // Normalize scores to a relative scale (e.g., max 100 for visual consistency) if needed,
  // or just map them directly. Let's map directly but ensure order is Wood->Fire->Earth->Gold->Water
  
  const data = [
    { subject: '木 (Wood)', A: scores.wood, fullMark: 100 },
    { subject: '火 (Fire)', A: scores.fire, fullMark: 100 },
    { subject: '土 (Earth)', A: scores.earth, fullMark: 100 },
    { subject: '金 (Metal)', A: scores.gold, fullMark: 100 },
    { subject: '水 (Water)', A: scores.water, fullMark: 100 },
  ];

  // Find max value to set domain dynamic or fixed
  const maxVal = Math.max(...Object.values(scores), 10);

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, maxVal + 10]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Energy"
            dataKey="A"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="#8b5cf6"
            fillOpacity={0.4}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
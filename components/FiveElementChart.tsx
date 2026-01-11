import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { FiveElementScore, ELEMENT_CN_MAP } from '../utils/baziLogic';

interface Props {
  scores: FiveElementScore;
}

export const FiveElementChart: React.FC<Props> = ({ scores }) => {
  // 转换数据格式以适配 Recharts
  // 顺序建议按五行相生顺序：木 -> 火 -> 土 -> 金 -> 水
  const data = [
    { subject: `木 (${ELEMENT_CN_MAP.wood})`, value: scores.wood, fullMark: 50 },
    { subject: `火 (${ELEMENT_CN_MAP.fire})`, value: scores.fire, fullMark: 50 },
    { subject: `土 (${ELEMENT_CN_MAP.earth})`, value: scores.earth, fullMark: 50 },
    { subject: `金 (${ELEMENT_CN_MAP.gold})`, value: scores.gold, fullMark: 50 },
    { subject: `水 (${ELEMENT_CN_MAP.water})`, value: scores.water, fullMark: 50 },
  ];

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="五行能量"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="#8b5cf6"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
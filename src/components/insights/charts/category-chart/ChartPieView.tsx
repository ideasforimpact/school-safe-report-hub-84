
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartPieViewProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
  activeIndex: number | null;
  total: number;
  onPieEnter: (_: any, index: number) => void;
  onPieLeave: () => void;
}

const ChartPieView: React.FC<ChartPieViewProps> = ({ 
  data, 
  colors, 
  activeIndex, 
  total,
  onPieEnter,
  onPieLeave
}) => {
  return (
    <div className="w-full md:w-1/3 h-[260px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationDuration={800}
            animationBegin={0}
            animationEasing="ease-out"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                strokeWidth={activeIndex === index ? 2 : 0}
                stroke="#fff"
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} incidents (${((value as number / total) * 100).toFixed(1)}%)`]} 
            contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartPieView;

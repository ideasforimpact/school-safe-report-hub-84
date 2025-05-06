
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList,
  Cell
} from 'recharts';
import { SubcategoryChartTooltip } from './SubcategoryTooltip';
import { getBarColor } from './utils';

interface SubcategoryBarChartProps {
  chartData: Array<{name: string, value: number, formattedValue: number}>;
  total: number;
  colors: string[];
}

const SubcategoryBarChart: React.FC<SubcategoryBarChartProps> = ({ chartData, total, colors }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 15, right: 50, left: 30, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={150} 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          content={<SubcategoryChartTooltip total={total} />}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          animationDuration={1500}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index, colors)} />
          ))}
          <LabelList 
            dataKey="formattedValue" 
            position="right" 
            style={{ fill: '#6b7280', fontWeight: 'bold', fontSize: 12 }} 
            formatter={(value: number) => {
              const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%';
              return `${value} (${percentage})`;
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SubcategoryBarChart;

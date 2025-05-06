
import React from 'react';

interface SubcategoryChartTooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string;
  total: number;
}

export const SubcategoryChartTooltip: React.FC<SubcategoryChartTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  total 
}) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
    
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          Count: <span className="font-semibold">{value}</span>
        </p>
        <p className="text-sm">
          Percentage: <span className="font-semibold">{percentage}</span>
        </p>
      </div>
    );
  }

  return null;
};


import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';

// Custom heatmap colors - using a blue gradient for better visual hierarchy
const getColor = (value: number) => {
  if (value === 0) return '#f3f4f6'; // Light gray for no incidents
  if (value <= 2) return '#dbeafe'; // Very light blue
  if (value <= 5) return '#93c5fd'; // Light blue
  if (value <= 10) return '#3b82f6'; // Medium blue
  if (value <= 20) return '#1d4ed8'; // Dark blue
  return '#1e3a8a'; // Very dark blue
};

interface HeatmapChartProps {
  data: Array<{
    name: string;
    values: Array<{
      day: string;
      value: number;
    }>;
  }>;
  title?: string;
  description?: string;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ 
  data, 
  title = "Incident Distribution",
  description = "Heatmap showing when and where incidents occur most often"
}) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const maxValue = data.reduce((max, location) => {
    const locationMax = Math.max(...location.values.map(v => v.value));
    return Math.max(max, locationMax);
  }, 0);

  return (
    <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b pb-4">
        <CardTitle className="text-lg font-bold text-indigo-900">{title}</CardTitle>
        <CardDescription className="text-indigo-700">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-3">
              <div className="px-2 py-1 font-medium text-sm text-indigo-600"></div>
              {days.map(day => (
                <div key={day} className="px-1 py-1 font-medium text-sm text-center bg-indigo-50 rounded-t-md">{day}</div>
              ))}
            </div>
            
            {/* Heatmap data */}
            {data.map((location, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-1 mb-2 group">
                <div className="px-2 py-1 font-medium text-sm truncate bg-indigo-50 rounded-l-md flex items-center">
                  {location.name}
                </div>
                
                {days.map(day => {
                  const dayData = location.values.find(v => v.day === day);
                  const value = dayData ? dayData.value : 0;
                  
                  return (
                    <div 
                      key={day}
                      className="aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all duration-150 hover:scale-105 hover:shadow-md" 
                      style={{ 
                        backgroundColor: getColor(value),
                        color: value > 5 ? 'white' : 'black'
                      }}
                      title={`${location.name} - ${day}: ${value} incidents`}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-end mt-6 gap-2 bg-slate-50 p-3 rounded-md">
            <div className="text-xs text-gray-600 font-medium">Incidents:</div>
            <div className="flex items-center gap-1">
              <div className="text-xs text-gray-600">Fewer</div>
              {[0, 2, 5, 10, 20].map((value, i) => (
                <div 
                  key={i} 
                  className="h-4 w-4 rounded-sm border border-slate-200"
                  style={{ backgroundColor: getColor(value) }}
                ></div>
              ))}
              <div className="text-xs text-gray-600">More</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;

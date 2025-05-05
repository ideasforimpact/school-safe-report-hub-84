
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Custom heatmap colors
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 gap-1 mb-3">
              <div className="font-medium text-sm text-gray-500 px-2"></div>
              {days.map(day => (
                <div key={day} className="font-medium text-sm text-center">{day}</div>
              ))}
            </div>
            
            {/* Heatmap data */}
            {data.map((location, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-1 mb-2">
                <div className="font-medium text-sm truncate px-2">{location.name}</div>
                
                {days.map(day => {
                  const dayData = location.values.find(v => v.day === day);
                  const value = dayData ? dayData.value : 0;
                  
                  return (
                    <div 
                      key={day}
                      className="aspect-square rounded-sm flex items-center justify-center text-xs font-medium" 
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
          <div className="flex items-center justify-end mt-4 gap-2 text-xs text-gray-500">
            <div>Fewer</div>
            {[0, 2, 5, 10, 20].map((value, i) => (
              <div 
                key={i} 
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getColor(value) }}
              ></div>
            ))}
            <div>More</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapChart;

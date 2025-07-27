import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IncidentHeatmapProps {
  stats: {
    monthlyIncidentsData: Array<{
      month: string;
      open: number;
      closed: number;
      total: number;
    }>;
  };
  loading: boolean;
}

const IncidentHeatmap = ({ stats, loading }: IncidentHeatmapProps) => {
  // Generate mock hourly data based on monthly totals for demonstration
  const generateHeatmapData = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);
    
    // Use the monthly data to create realistic patterns
    const avgIncidentsPerDay = stats.monthlyIncidentsData.length > 0 
      ? stats.monthlyIncidentsData.reduce((sum, month) => sum + month.total, 0) / (stats.monthlyIncidentsData.length * 30)
      : 0.1;

    return daysOfWeek.map(day => ({
      day,
      hours: hoursOfDay.map(hour => {
        // Create realistic patterns: higher incidents during work hours (8-17) and weekdays
        let baseRate = avgIncidentsPerDay;
        
        // Adjust for day of week (weekdays higher than weekends)
        if (day === 'Sat' || day === 'Sun') {
          baseRate *= 0.3;
        }
        
        // Adjust for hour of day
        if (hour >= 8 && hour <= 17) {
          baseRate *= 2.5; // Work hours
        } else if (hour >= 18 && hour <= 22) {
          baseRate *= 1.2; // Evening hours
        } else if (hour >= 0 && hour <= 6) {
          baseRate *= 0.2; // Night hours
        }
        
        // Add some randomness
        const incidents = Math.max(0, Math.round(baseRate + (Math.random() - 0.5) * baseRate));
        
        return {
          hour,
          incidents,
          intensity: Math.min(incidents / (avgIncidentsPerDay * 3), 1) // Normalize to 0-1
        };
      })
    }));
  };

  const heatmapData = generateHeatmapData();
  const maxIncidents = Math.max(...heatmapData.flatMap(day => day.hours.map(h => h.incidents)));

  const getHeatmapColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity <= 0.2) return 'bg-green-200';
    if (intensity <= 0.4) return 'bg-yellow-300';
    if (intensity <= 0.6) return 'bg-orange-400';
    if (intensity <= 0.8) return 'bg-red-400';
    return 'bg-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Incident Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-25 gap-1">
              {Array.from({ length: 175 }).map((_, index) => (
                <div key={index} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Incident Heatmap</CardTitle>
        <p className="text-sm text-gray-600">Incident patterns by day and time</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Hour labels */}
          <div className="grid grid-cols-25 gap-1 text-xs text-gray-500">
            <div></div> {/* Empty cell for day labels */}
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="text-center">
                {i === 0 ? '12A' : i < 12 ? `${i}A` : i === 12 ? '12P' : `${i-12}P`}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayData.day} className="grid grid-cols-25 gap-1">
              {/* Day label */}
              <div className="text-xs text-gray-500 font-medium flex items-center">
                {dayData.day}
              </div>
              
              {/* Hour cells */}
              {dayData.hours.map((hourData, hourIndex) => (
                <div
                  key={`${dayIndex}-${hourIndex}`}
                  className={`h-6 rounded cursor-pointer transition-all duration-200 hover:scale-110 ${getHeatmapColor(hourData.intensity)}`}
                  title={`${dayData.day} ${hourData.hour}:00 - ${hourData.incidents} incidents`}
                ></div>
              ))}
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">Less</div>
            <div className="flex space-x-1">
              {['bg-gray-100', 'bg-green-200', 'bg-yellow-300', 'bg-orange-400', 'bg-red-400', 'bg-red-600'].map((color, index) => (
                <div key={index} className={`h-3 w-3 rounded ${color}`}></div>
              ))}
            </div>
            <div className="text-xs text-gray-500">More</div>
          </div>
          
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{maxIncidents}</div>
              <div className="text-xs text-gray-600">Peak Incidents</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {Math.round(heatmapData.flatMap(d => d.hours).reduce((sum, h) => sum + h.incidents, 0) / 7)}
              </div>
              <div className="text-xs text-gray-600">Daily Average</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">9-5</div>
              <div className="text-xs text-gray-600">Peak Hours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">Mon-Fri</div>
              <div className="text-xs text-gray-600">Peak Days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentHeatmap;
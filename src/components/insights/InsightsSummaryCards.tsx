import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Users, MapPin } from 'lucide-react';
import { useTimeSeriesMetrics } from '@/hooks/insights/useTimeSeriesMetrics';

interface InsightsSummaryCardsProps {
  filteredIncidents: any[];
  timeSeriesData: Array<{month: string, count: number}>;
  categoryData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
}

const InsightsSummaryCards: React.FC<InsightsSummaryCardsProps> = ({
  filteredIncidents,
  timeSeriesData,
  categoryData,
  statusData,
  facilityData
}) => {
  const timeSeriesMetrics = useTimeSeriesMetrics(timeSeriesData);

  // Calculate summary metrics
  const totalIncidents = filteredIncidents.length;
  const openIncidents = statusData.find(s => s.name === 'Open')?.value || 0;
  const mostCommonCategory = categoryData.length > 0 ? categoryData[0].name : 'N/A';
  const affectedFacilities = facilityData.length;

  const summaryCards = [
    {
      title: 'Total Incidents',
      value: totalIncidents,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      trend: {
        isIncreasing: timeSeriesMetrics.isIncreasing,
        percentage: timeSeriesMetrics.percentageChange,
        label: timeSeriesMetrics.isIncreasing ? 'increase' : 'decrease'
      }
    },
    {
      title: 'Open Cases',
      value: openIncidents,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      trend: null
    },
    {
      title: 'Most Common',
      value: mostCommonCategory,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      trend: null
    },
    {
      title: 'Affected Facilities',
      value: affectedFacilities,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {summaryCards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trend?.isIncreasing ? TrendingUp : 
                         card.trend?.isIncreasing === false ? TrendingDown : Minus;
        
        return (
          <Card key={index} className={`border ${card.borderColor} hover:shadow-lg transition-all duration-300 ${card.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  {card.trend && (
                    <div className="flex items-center space-x-1">
                      <TrendIcon className={`h-4 w-4 ${card.trend.isIncreasing ? 'text-red-500' : 'text-green-500'}`} />
                      <span className={`text-sm font-medium ${card.trend.isIncreasing ? 'text-red-500' : 'text-green-500'}`}>
                        {card.trend.percentage}% {card.trend.label}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default InsightsSummaryCards;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { FacilityRisk } from '@/hooks/useNewInsightsData';

interface FacilityRiskCardProps {
  risk: FacilityRisk;
  onFilterApply: (filterType: string, value: string) => void;
}

const FacilityRiskCard: React.FC<FacilityRiskCardProps> = ({ risk, onFilterApply }) => {
  const topFacility = risk.topFacilities[0];

  return (
    <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-none shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">High-Risk Facilities</CardTitle>
        <Building2 className="h-4 w-4 text-white/80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topFacility ? (
            <>
              <div 
                className="cursor-pointer hover:bg-white/20 p-2 rounded transition-colors"
                onClick={() => onFilterApply('facility', topFacility.name)}
              >
                <div className="text-lg font-semibold text-white">{topFacility.name}</div>
                <div className="text-sm text-white/80">
                  {topFacility.count} incidents ({topFacility.percentage.toFixed(1)}%)
                </div>
              </div>
              
              <div className="space-y-1">
                {risk.topFacilities.slice(1, 4).map((facility, index) => (
                  <div 
                    key={facility.name}
                    className="flex justify-between items-center text-sm cursor-pointer hover:bg-white/10 p-1 rounded"
                    onClick={() => onFilterApply('facility', facility.name)}
                  >
                    <span className="truncate text-white">{facility.name}</span>
                    <span className="text-white/80">{facility.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-white/80">No facility data available</div>
          )}
          
          <div className="text-xs text-white/80 pt-2 border-t border-white/20">
            Total: {risk.totalIncidents} incidents
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilityRiskCard;
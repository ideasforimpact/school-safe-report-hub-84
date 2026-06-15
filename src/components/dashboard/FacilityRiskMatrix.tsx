import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';


interface FacilityRiskMatrixProps {
  loading?: boolean;
}

const FacilityRiskMatrix = ({ loading = false }: FacilityRiskMatrixProps) => {
  const { employeeData } = useAuth();

  const { data: facilityRiskData = [], isLoading } = useQuery({
    queryKey: ['facility-risk-matrix', employeeData?.clientId],
    queryFn: async () => {
      if (!employeeData?.clientId) return [];

      const { data, error } = await supabase.functions.invoke('dashboard-stats', {
        body: { action: 'facility_risk_matrix', client_id: employeeData.clientId },
      });
      if (error) throw error;
      return data?.data ?? [];
    },
    enabled: !!employeeData?.clientId,
  });

  const maxRiskScore = Math.max(...facilityRiskData.map(f => f.riskScore || 0), 1);

  const getRiskColor = (count: number, priority: string) => {
    if (count === 0) return '';
    const intensity = Math.min(count / 5, 1);
    
    switch (priority) {
      case 'Critical':
        return `bg-destructive/${Math.round(intensity * 100) || 20}`;
      case 'High':
        return `bg-orange-500/${Math.round(intensity * 100) || 20}`;
      case 'Medium':
        return `bg-yellow-500/${Math.round(intensity * 100) || 20}`;
      case 'Low':
        return `bg-green-500/${Math.round(intensity * 100) || 20}`;
      default:
        return '';
    }
  };

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Facility Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Facility Risk Assessment</CardTitle>
        <p className="text-sm text-muted-foreground">Incident distribution by facility and priority</p>
      </CardHeader>
      <CardContent>
        {facilityRiskData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-96 overflow-auto no-scrollbar">
              {/* Header */}
              <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground mb-2">
                <div className="col-span-2">Facility</div>
                <div className="text-center">Critical</div>
                <div className="text-center">High</div>
                <div className="text-center">Medium</div>
                <div className="text-center">Low</div>
              </div>

              {/* Rows */}
          <div className="space-y-2">
            {facilityRiskData.map((facility) => (
              <div key={facility.name} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-2 text-sm font-medium truncate">
                  {facility.name}
                </div>
                {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
                  <div
                    key={priority}
                    className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 cursor-pointer ${getRiskColor(facility[priority], priority)}`}
                    title={`${facility.name} - ${priority}: ${facility[priority]} incidents`}
                  >
                    {facility[priority] > 0 ? facility[priority] : '0'}
                  </div>
                ))}
                  </div>
                ))}
              </div>
            </div>
             {/* SUMMARY SECTION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold">{facilityRiskData.length}</div>
                <div className="text-xs text-muted-foreground">Facilities</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {facilityRiskData.reduce((sum, f) => sum + (f.Critical || 0),0)}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {facilityRiskData[0]?.name || "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">Highest Risk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {facilityRiskData.reduce((sum, f) => sum + (f.total || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Incidents
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No facility data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacilityRiskMatrix;
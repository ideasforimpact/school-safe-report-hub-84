import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

interface FacilityRiskMatrixProps {
  loading?: boolean;
}

const FacilityRiskMatrix = ({ loading = false }: FacilityRiskMatrixProps) => {
  const { user } = useAuth();
  const { client } = useClient();

  const { data: facilityRiskData = [], isLoading } = useQuery({
    queryKey: ['facility-risk-matrix', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];

      // Get facilities with incident counts by priority
      const { data: incidents } = await supabase
        .from('incidents')
        .select(`
          id,
          facility_id,
          priority_id,
          facilities!inner(id, name),
          incident_priorities!inner(id, name, weight)
        `)
        .eq('client_id', client.id);

      if (!incidents) return [];

      // Group by facility and priority
      const facilityMap = new Map();
      
      incidents.forEach(incident => {
        if (!incident.facilities || !incident.incident_priorities) return;
        
        const facilityName = incident.facilities.name;
        const priorityName = incident.incident_priorities.name;
        const priorityWeight = incident.incident_priorities.weight || 1;
        
        if (!facilityMap.has(facilityName)) {
          facilityMap.set(facilityName, { Critical: 0, High: 0, Medium: 0, Low: 0, total: 0 });
        }
        
        const facility = facilityMap.get(facilityName);
        facility[priorityName] = (facility[priorityName] || 0) + 1;
        facility.total += 1;
        facility.riskScore = (facility.riskScore || 0) + priorityWeight;
      });

      return Array.from(facilityMap.entries()).map(([name, data]) => ({
        name,
        ...data
      })).sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    },
    enabled: !!client?.id,
  });

  const maxRiskScore = Math.max(...facilityRiskData.map(f => f.riskScore || 0), 1);

  const getRiskColor = (count: number, priority: string) => {
    if (count === 0) return 'bg-muted/20';
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
        return 'bg-muted/20';
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
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-2">Facility</div>
            <div className="text-center">Critical</div>
            <div className="text-center">High</div>
            <div className="text-center">Medium</div>
            <div className="text-center">Low</div>
          </div>

          {/* Facility rows */}
          <div className="space-y-2">
            {facilityRiskData.slice(0, 8).map((facility) => (
              <div key={facility.name} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-2 text-sm font-medium truncate" title={facility.name}>
                  {facility.name}
                </div>
                {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
                  <div
                    key={priority}
                    className={`h-8 rounded flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110 cursor-pointer ${getRiskColor(facility[priority], priority)}`}
                    title={`${facility.name} - ${priority}: ${facility[priority]} incidents`}
                  >
                    {facility[priority] > 0 ? facility[priority] : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {facilityRiskData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No facility data available
            </div>
          )}

          {/* Legend and summary */}
          {facilityRiskData.length > 0 && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{facilityRiskData.length}</div>
                  <div className="text-xs text-muted-foreground">Facilities</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {facilityRiskData.reduce((sum, f) => sum + (f.Critical || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {facilityRiskData[0]?.name || 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">Highest Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {facilityRiskData.reduce((sum, f) => sum + (f.total || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Incidents</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilityRiskMatrix;
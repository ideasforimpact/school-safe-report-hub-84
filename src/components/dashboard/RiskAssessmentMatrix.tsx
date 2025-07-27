import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';

interface RiskAssessmentMatrixProps {
  stats: {
    openIncidents: number;
    incidentsLastMonth: number;
  };
  loading: boolean;
}

const RiskAssessmentMatrix = ({ stats, loading }: RiskAssessmentMatrixProps) => {
  // Mock risk data - in real implementation this would come from incident analysis
  const riskData = [
    { category: 'Physical Injury', frequency: 2, severity: 4, count: 3 },
    { category: 'Equipment Failure', frequency: 3, severity: 2, count: 5 },
    { category: 'Security Breach', frequency: 1, severity: 3, count: 1 },
    { category: 'Health Concern', frequency: 2, severity: 2, count: 2 },
    { category: 'Property Damage', frequency: 1, severity: 4, count: 1 }
  ];

  const getRiskLevel = (frequency: number, severity: number) => {
    const riskScore = frequency * severity;
    if (riskScore >= 12) return { level: 'Critical', color: 'bg-destructive text-destructive-foreground' };
    if (riskScore >= 8) return { level: 'High', color: 'bg-orange-500 text-white' };
    if (riskScore >= 4) return { level: 'Medium', color: 'bg-warning text-warning-foreground' };
    return { level: 'Low', color: 'bg-success text-success-foreground' };
  };

  const getRiskColor = (frequency: number, severity: number) => {
    const riskScore = frequency * severity;
    if (riskScore >= 12) return 'bg-destructive/90';
    if (riskScore >= 8) return 'bg-orange-500/90';
    if (riskScore >= 4) return 'bg-warning/90';
    return 'bg-success/90';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted rounded animate-pulse"></div>
              <div className="h-20 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Risk Assessment Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Matrix Grid */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Risk Level = Frequency × Severity
          </div>
          
          {/* Matrix Headers */}
          <div className="grid grid-cols-6 gap-1 text-xs">
            <div></div>
            <div className="text-center font-medium text-muted-foreground">1</div>
            <div className="text-center font-medium text-muted-foreground">2</div>
            <div className="text-center font-medium text-muted-foreground">3</div>
            <div className="text-center font-medium text-muted-foreground">4</div>
            <div className="text-center font-medium text-muted-foreground">5</div>
          </div>
          
          {/* Matrix Grid */}
          {[5, 4, 3, 2, 1].map((severity) => (
            <div key={severity} className="grid grid-cols-6 gap-1">
              <div className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center">
                {severity}
              </div>
              {[1, 2, 3, 4, 5].map((frequency) => {
                const riskScore = frequency * severity;
                const riskColor = getRiskColor(frequency, severity);
                const cellData = riskData.find(d => 
                  Math.round(d.frequency) === frequency && Math.round(d.severity) === severity
                );
                
                return (
                  <div
                    key={`${frequency}-${severity}`}
                    className={`h-12 w-12 rounded border border-border ${riskColor} flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform cursor-pointer`}
                    title={cellData ? `${cellData.category}: ${cellData.count} incidents` : `Risk Score: ${riskScore}`}
                  >
                    {cellData ? cellData.count : riskScore}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Axis Labels */}
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <div></div>
            <div>Frequency →</div>
          </div>
          <div className="text-xs text-muted-foreground -rotate-90 absolute left-4 top-1/2 transform -translate-y-1/2">
            ← Severity
          </div>
        </div>

        {/* Risk Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Risk Categories
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {riskData.map((risk, index) => {
              const riskLevel = getRiskLevel(risk.frequency, risk.severity);
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{risk.category}</div>
                    <div className="text-xs text-muted-foreground">{risk.count} incidents</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${riskLevel.color}`}>
                    {riskLevel.level}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded"></div>
            <span>Low (1-3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-warning rounded"></div>
            <span>Medium (4-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>High (8-11)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>Critical (12+)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentMatrix;
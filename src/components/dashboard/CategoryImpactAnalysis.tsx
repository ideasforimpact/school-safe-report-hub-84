import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useModuleEnabled, useHasAnyDashboardModule } from '@/hooks/useModuleAccess';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin, isModuleAdmin } from '@/store/employeeSelectors';

interface CategoryImpactAnalysisProps {
  loading?: boolean;
}

const CategoryImpactAnalysis = ({ loading = false }: CategoryImpactAnalysisProps) => {
  const { employeeData } = useAuth();
  const { state } = useEmployeeStore();
  const isModuleEnabled = useModuleEnabled();
  const hasAnyDashboardModule = useHasAnyDashboardModule();
  const hasIncidents = isModuleEnabled('incidents');
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const hasIncidentAdmin = isModuleAdmin(state, 'incidents');
  const currentEmployeeId = state.employeeData?.id;

  const { data: fetchedCategoryData = [], isLoading } = useQuery({
    queryKey: ['category-impact-analysis', employeeData?.clientId, currentEmployeeId, isSuperAdmin, hasIncidentAdmin],
    queryFn: async () => {
      if (!employeeData?.clientId) return [];
      const { data, error } = await supabase.functions.invoke('dashboard-stats', {
        body: {
          action: 'category_impact',
          client_id: employeeData.clientId,
          employee_id: currentEmployeeId,
          is_super_admin: isSuperAdmin,
          has_incident_admin: hasIncidentAdmin,
        },
      });
      if (error) throw error;
      return data?.data ?? [];
    },
    enabled: !!employeeData?.clientId && hasIncidents,
  });

  // enabled:false only stops future fetches — it doesn't clear a previously
  // cached result for this queryKey, so gate the rendered data on hasIncidents
  // directly rather than trusting the query's returned data.
  const categoryData = hasIncidents ? fetchedCategoryData : [];

  // Colors for categories
  const COLORS = [
    '#1E40AF', // Royal Blue
    '#065F46', // Emerald Green
    '#7C2D12', // Burgundy
    '#4C1D95', // Royal Purple
    '#92400E', // Antique Gold
    '#0F172A', // Midnight Navy
    '#9F1239', // Wine Red
    '#1F2937', // Charcoal Slate
  ];

  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as { name: string; value: number; subcategories?: { name: string; count: number }[] };
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} incidents ({((data.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1)}%)
          </p>
          {data.subcategories && data.subcategories.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-medium mb-1">Top subcategories:</p>
              {data.subcategories.map((sub, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  • {sub.name}: {sub.count}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // No Incidents access — hide the card entirely, unless the employee has no real
  // module at all (only Dashboard, or nothing), where it shows its empty state instead.
  if (!hasIncidents && hasAnyDashboardModule) {
    return null;
  }

  if (loading || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Category Impact Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalIncidents = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Category Impact Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">Incident distribution by category with top subcategories</p>
      </CardHeader>
      <CardContent>
        {categoryData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold">{totalIncidents}</div>
                <div className="text-xs text-muted-foreground">Total Incidents</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{categoryData.length}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {categoryData[0]?.name.split(' ')[0] || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Top Category</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {categoryData[0] ? Math.round((categoryData[0].value / totalIncidents) * 100) : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Highest Impact</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No category data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryImpactAnalysis;
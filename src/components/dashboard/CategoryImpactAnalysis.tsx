import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryImpactAnalysisProps {
  loading?: boolean;
}

const CategoryImpactAnalysis = ({ loading = false }: CategoryImpactAnalysisProps) => {
  const { employeeData } = useAuth();

  const { data: categoryData = [], isLoading } = useQuery({
    queryKey: ['category-impact-analysis', employeeData?.clientId],
    queryFn: async () => {
      if (!employeeData?.clientId) return [];

      // Get incidents with categories and subcategories
      const { data: incidents } = await supabase
        .from('incidents')
        .select(`
          id,
          category_id,
          subcategory_id,
          incident_categories!inner(id, name),
          incident_subcategories(id, name)
        `)
        .eq('client_id', employeeData.clientId);

      if (!incidents) return [];

      // Group by category
      const categoryMap = new Map();
      
      incidents.forEach(incident => {
        if (!incident.incident_categories) return;
        
        const categoryName = incident.incident_categories.name;
        
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: 0,
            subcategories: new Map()
          });
        }
        
        const category = categoryMap.get(categoryName);
        category.value += 1;
        
        // Track subcategories
        if (incident.incident_subcategories) {
          const subName = incident.incident_subcategories.name;
          const currentCount = category.subcategories.get(subName) || 0;
          category.subcategories.set(subName, currentCount + 1);
        }
      });

      return Array.from(categoryMap.values())
        .map(category => ({
          ...category,
          subcategories: Array.from(category.subcategories.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3) // Top 3 subcategories
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!employeeData?.clientId,
  });

  // Colors for categories
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))'
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} incidents ({((data.value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1)}%)
          </p>
          {data.subcategories && data.subcategories.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-medium mb-1">Top subcategories:</p>
              {data.subcategories.map((sub: any, index: number) => (
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
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { WorkloadMetrics } from '@/utils/insights/advancedMetrics';

interface WorkloadDistributionChartProps {
  workloadMetrics: WorkloadMetrics;
}

const WorkloadDistributionChart: React.FC<WorkloadDistributionChartProps> = ({
  workloadMetrics
}) => {
  // Prepare data for bar chart (top 10 assignees)
  const topAssignees = workloadMetrics.workloadDistribution.slice(0, 10);
  
  // Prepare data for pie chart (workload categories)
  const workloadCategories = [
    {
      name: 'Light Load (1-3)',
      value: workloadMetrics.workloadDistribution.filter(w => w.count <= 3).length,
      color: '#10b981'
    },
    {
      name: 'Medium Load (4-7)',
      value: workloadMetrics.workloadDistribution.filter(w => w.count > 3 && w.count <= 7).length,
      color: '#f59e0b'
    },
    {
      name: 'Heavy Load (8+)',
      value: workloadMetrics.workloadDistribution.filter(w => w.count > 7).length,
      color: '#ef4444'
    }
  ].filter(category => category.value > 0);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Workload Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Workload</CardTitle>
          <CardDescription>Incident count per team member</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAssignees} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="assignee" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} incidents`, 'Workload']}
              />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workload Categories Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Workload Distribution</CardTitle>
          <CardDescription>Team members by workload category</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workloadCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {workloadCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} people`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkloadDistributionChart;
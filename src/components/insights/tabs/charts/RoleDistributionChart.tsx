
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface RoleDistributionChartProps {
  data: Array<{name: string, value: number}>;
  colors: string[];
}

const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data, colors }) => {
  // Calculate total incidents for role distribution
  const totalRoleIncidents = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col items-start">
        <CardTitle className="text-left">Role Distribution</CardTitle>
        <CardDescription className="text-left">
          Distribution of incidents by role of people involved
        </CardDescription>
      </CardHeader>
      <CardContent className="relative h-80">
        {data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Donut chart visualization - aligned to the left */}
            <div className="lg:col-span-1 h-full flex items-center justify-start relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    innerRadius="60%"
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]} 
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = ((data.value / totalRoleIncidents) * 100).toFixed(1);
                        return (
                          <div className="bg-white p-2 border rounded shadow-md">
                            <p className="font-semibold">{data.name}</p>
                            <p>Count: {data.value}</p>
                            <p>{percentage}% of total</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value, entry, index) => (
                      <span className="text-sm font-medium">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered metrics */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-3xl font-bold">{totalRoleIncidents}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
            
            {/* Data table with percentages - expanded to take more space */}
            <div className="lg:col-span-2 h-full overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((role, index) => (
                    <TableRow key={`role-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{backgroundColor: colors[index % colors.length]}}
                          ></div>
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{role.value}</TableCell>
                      <TableCell className="text-right">
                        {((role.value / totalRoleIncidents) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleDistributionChart;

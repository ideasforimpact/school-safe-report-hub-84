
import React from 'react';
import CategoryChart from '../charts/category-chart';
import BarChartComponent from '../charts/BarChartComponent';
import TimeSeriesAnalysis from '../charts/TimeSeriesAnalysis';
import StatusBlocks from '../charts/StatusBlocks';
import HeatmapChart from '../charts/HeatmapChart';
import RiskAssessmentChart from '../charts/RiskAssessmentChart';
import SubcategoryChart from '../charts/SubcategoryChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChartsTabProps {
  categoryData: Array<{name: string, value: number}>;
  typeData: Array<{name: string, value: number}>;
  subcategoryData: Array<{name: string, value: number}>;
  timeSeriesData: Array<{month: string, count: number}>;
  locationData: Array<{name: string, value: number}>;
  facilityData: Array<{name: string, value: number}>;
  assigneeData: Array<{name: string, value: number}>;
  statusData: Array<{name: string, value: number}>;
  riskData: Array<{name: string, frequency: number, severity: number, count: number}>;
  isAdmin: boolean;
  colors: string[];
  roleDistributionData?: Array<{name: string, value: number}>;
}

const ChartsTab: React.FC<ChartsTabProps> = ({
  categoryData,
  typeData,
  subcategoryData,
  timeSeriesData,
  locationData,
  facilityData,
  assigneeData,
  statusData,
  riskData,
  isAdmin,
  colors,
  roleDistributionData = []
}) => {
  // Calculate total incidents for role distribution
  const totalRoleIncidents = roleDistributionData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="mt-4 space-y-8 w-full">
      {/* First row: Featured Incidents by Category chart - Increased height to 400px */}
      <div className="h-[400px] shadow-sm rounded-xl overflow-hidden w-full">
        <CategoryChart data={categoryData} colors={colors} />
      </div>
      
      {/* Status Blocks - our new component */}
      <div className="w-full">
        <StatusBlocks data={statusData} />
      </div>
      
      {/* Role Distribution - with improved donut chart layout */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>
            Distribution of incidents by role of people involved
          </CardDescription>
        </CardHeader>
        <CardContent className="relative h-80">
          {roleDistributionData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Donut chart visualization */}
              <div className="lg:col-span-2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      innerRadius="60%"
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {roleDistributionData.map((entry, index) => (
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
                <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-3xl font-bold">{totalRoleIncidents}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
              
              {/* Data table with percentages */}
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleDistributionData.map((role, index) => (
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
      
      {/* Full-width Risk Assessment Matrix - moved out of grid and made prominent */}
      <div className="h-[500px] shadow-sm rounded-xl overflow-hidden w-full">
        <RiskAssessmentChart data={riskData} />
      </div>
      
      {/* Second row: Incidents by Type */}
      <div className="h-[400px] w-full">
        <BarChartComponent 
          title="Incidents by Type" 
          description="Compare occurrence of incidents, near misses, and unsafe conditions"
          data={typeData}
        />
      </div>
      
      {/* Full width subcategories chart */}
      <div className="h-[500px] w-full">
        <SubcategoryChart 
          data={subcategoryData}
          colors={colors}
        />
      </div>
      
      {/* Remaining charts in a grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="h-[400px]">
          <TimeSeriesAnalysis 
            data={timeSeriesData} 
            title="Incidents Over Time"
            description="Monthly trend of incidents with statistical analysis"
          />
        </div>
        
        <div className="h-[400px]">
          <BarChartComponent 
            title="Incident Location" 
            description="Distribution of incidents by location"
            data={locationData}
            color="#0ea5e9"
            layout="vertical"
          />
        </div>
      </div>

      {/* Facilities chart - auto fit content height instead of fixed height */}
      {isAdmin && facilityData.length > 0 && (
        <div className="shadow-sm rounded-xl overflow-hidden w-full">
          <CategoryChart 
            data={facilityData} 
            colors={colors}
            title="Incidents by Facility"
          />
        </div>
      )}
      
      <div className="h-[400px] shadow-sm rounded-xl overflow-hidden w-full">
        <CategoryChart 
          data={assigneeData} 
          colors={colors}
          title="Incident Ownership"
        />
      </div>
    </div>
  );
};

export default ChartsTab;

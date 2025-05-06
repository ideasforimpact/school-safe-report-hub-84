
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
  roleDistributionData?: Array<{name: string, value: number}>; // Added this prop
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
  roleDistributionData = [] // Provide default empty array
}) => {
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
      
      {/* Role Distribution - moved from PeopleTab */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>
            Distribution of incidents by role of people involved
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {roleDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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

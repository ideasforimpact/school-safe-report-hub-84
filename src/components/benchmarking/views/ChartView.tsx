
import React from 'react';
import { Columns3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartViewProps {
  selectedCategory: string;
  showSubcategories: boolean;
  chartData: any[];
  selectedCities: string[];
}

const ChartView = ({ selectedCategory, showSubcategories, chartData, selectedCities }: ChartViewProps) => {
  const barColors = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="border rounded-md p-4 bg-white">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <Columns3 className="h-5 w-5 mr-2 text-primary-600" />
        {selectedCategory 
          ? showSubcategories 
            ? `${selectedCategory} Subcategories Comparison` 
            : `${selectedCategory} Comparison by City`
          : 'Select a category to view comparison'
        }
      </h3>
      
      {chartData.length > 0 ? (
        <div className="h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end"
                height={70} 
                tick={{fontSize: 12}}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Your School" fill="#4f46e5" />
              
              {/* Render bars for each selected city */}
              {!showSubcategories && <Bar dataKey="City Average" fill="#94a3b8" />}
              
              {showSubcategories && selectedCities.map((city, index) => (
                <Bar 
                  key={city} 
                  dataKey={city} 
                  fill={barColors[index % barColors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">No data available for the selected category</p>
      )}
    </div>
  );
};

export default ChartView;

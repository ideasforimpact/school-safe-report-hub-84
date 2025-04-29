
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncidents, IncidentCategory } from '@/contexts/IncidentContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Mock city-level benchmarking data
const cityData = {
  'Physical Injury': {
    'Falls': 42,
    'Sports Injuries': 38,
    'Playground Accidents': 31,
    'Classroom Accidents': 24,
    'Other Physical Injuries': 18
  },
  'Behavioral Incident': {
    'Bullying': 27,
    'Fighting': 22,
    'Vandalism': 15,
    'Disruptive Behavior': 34,
    'Other Behavioral Issues': 12
  },
  'Health Emergency': {
    'Allergic Reaction': 16,
    'Asthma Attack': 19,
    'Seizure': 8,
    'Illness': 29,
    'Other Health Emergencies': 11
  },
  'Security Event': {
    'Unauthorized Access': 7,
    'Theft': 14,
    'Trespassing': 6,
    'Suspicious Activity': 11,
    'Other Security Events': 5
  }
};

const Benchmarking = () => {
  const { incidents } = useIncidents();
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | ''>('Physical Injury');
  
  const getSchoolData = () => {
    if (!selectedCategory) return [];
    
    // Count incidents by subcategory for the selected category
    const subcategoryCounts = incidents
      .filter(incident => incident.category === selectedCategory)
      .reduce((acc, incident) => {
        const subcategory = incident.subcategory || 'Other';
        acc[subcategory] = (acc[subcategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    // Get city data for comparison
    const citySubcategoryCounts = cityData[selectedCategory as keyof typeof cityData] || {};
    
    // Create comparison data for chart
    return Object.keys({...subcategoryCounts, ...citySubcategoryCounts}).map(subcategory => ({
      name: subcategory,
      'Your School': subcategoryCounts[subcategory] || 0,
      'City Average': citySubcategoryCounts[subcategory as keyof typeof citySubcategoryCounts] || 0
    }));
  };
  
  const categories = Object.keys(cityData);
  const chartData = getSchoolData();
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Benchmarking</h1>
          <p className="text-gray-600 mt-1">Compare your school's incidents with city-wide averages</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>City-Level Benchmarking</CardTitle>
            <CardDescription>
              Anonymous aggregated data from schools across the city to help you benchmark safety performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Category</label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value as IncidentCategory)}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="pt-4">
                <div className="border rounded-md p-4 bg-white">
                  <h3 className="text-lg font-medium mb-4">
                    {selectedCategory ? `${selectedCategory} Comparison` : 'Select a category to view comparison'}
                  </h3>
                  
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
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
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Your School" fill="#4f46e5" />
                        <Bar dataKey="City Average" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-10">No data available for the selected category</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="pt-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subcategory</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Your School</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">City Average</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Difference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {chartData.length > 0 ? (
                        chartData.map((item, index) => {
                          const difference = item['Your School'] - item['City Average'];
                          const isHigher = difference > 0;
                          
                          return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 text-sm">{item.name}</td>
                              <td className="px-4 py-3 text-sm">{item['Your School']}</td>
                              <td className="px-4 py-3 text-sm">{item['City Average']}</td>
                              <td className={`px-4 py-3 text-sm font-medium ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
                                {difference === 0 ? 'Equal' : `${isHigher ? '+' : ''}${difference}`}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-500 text-center" colSpan={4}>
                            No data available for the selected category
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium mb-2">About Benchmarking Data</h4>
              <p className="text-xs text-gray-600">
                This anonymized data is collected from schools across the city to help you compare your safety 
                performance. All personal information has been removed and data is aggregated to protect privacy.
                Updates occur quarterly to ensure comparison against current trends.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Benchmarking;


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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Columns3, Filter, ChevronRight, BarChart2 } from 'lucide-react';

// Mock city-level benchmarking data
const cityData = {
  'Central City': {
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
  },
  'West District': {
    'Physical Injury': {
      'Falls': 38,
      'Sports Injuries': 45,
      'Playground Accidents': 28,
      'Classroom Accidents': 19,
      'Other Physical Injuries': 15
    },
    'Behavioral Incident': {
      'Bullying': 24,
      'Fighting': 18,
      'Vandalism': 12,
      'Disruptive Behavior': 30,
      'Other Behavioral Issues': 10
    },
    'Health Emergency': {
      'Allergic Reaction': 14,
      'Asthma Attack': 17,
      'Seizure': 6,
      'Illness': 25,
      'Other Health Emergencies': 9
    },
    'Security Event': {
      'Unauthorized Access': 5,
      'Theft': 11,
      'Trespassing': 4,
      'Suspicious Activity': 9,
      'Other Security Events': 3
    }
  },
  'East County': {
    'Physical Injury': {
      'Falls': 46,
      'Sports Injuries': 35,
      'Playground Accidents': 33,
      'Classroom Accidents': 28,
      'Other Physical Injuries': 21
    },
    'Behavioral Incident': {
      'Bullying': 30,
      'Fighting': 25,
      'Vandalism': 18,
      'Disruptive Behavior': 38,
      'Other Behavioral Issues': 15
    },
    'Health Emergency': {
      'Allergic Reaction': 19,
      'Asthma Attack': 22,
      'Seizure': 10,
      'Illness': 32,
      'Other Health Emergencies': 13
    },
    'Security Event': {
      'Unauthorized Access': 9,
      'Theft': 16,
      'Trespassing': 8,
      'Suspicious Activity': 13,
      'Other Security Events': 7
    }
  }
};

const Benchmarking = () => {
  const { incidents } = useIncidents();
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategory | ''>('Physical Injury');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Central City']);
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  // Available categories and city names
  const categories = Object.keys(cityData['Central City']);
  const cityNames = Object.keys(cityData);
  
  const toggleCity = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      // Remove if already selected
      setSelectedCities(selectedCities.filter(city => city !== cityName));
    } else {
      // Add if not selected
      setSelectedCities([...selectedCities, cityName]);
    }
  };
  
  const getChartData = () => {
    if (!selectedCategory) return [];
    
    if (showSubcategories) {
      // Show detailed subcategory breakdown
      const subcategories = selectedCategory ? Object.keys(cityData['Central City'][selectedCategory as keyof typeof cityData['Central City']]) : [];
      
      return subcategories.map(subcategory => {
        const dataItem: Record<string, any> = { name: subcategory };
        
        // Add school data
        const schoolCount = incidents
          .filter(incident => incident.category === selectedCategory && incident.subcategory === subcategory)
          .length;
        dataItem['Your School'] = schoolCount;
        
        // Add each selected city's data
        selectedCities.forEach(city => {
          const citySubData = cityData[city as keyof typeof cityData][selectedCategory as keyof typeof cityData['Central City']];
          dataItem[city] = citySubData[subcategory as keyof typeof citySubData] || 0;
        });
        
        return dataItem;
      });
    } else {
      // Show aggregate category-level data
      return selectedCities.map(city => {
        const citySubcategoryData = cityData[city as keyof typeof cityData][selectedCategory as keyof typeof cityData['Central City']];
        const totalCityIncidents = citySubcategoryData ? Object.values(citySubcategoryData).reduce((a: number, b: number) => a + b, 0) : 0;
        
        // Count school incidents for this category
        const schoolCategoryCount = incidents
          .filter(incident => incident.category === selectedCategory)
          .length;
        
        return {
          name: city,
          'City Average': totalCityIncidents,
          'Your School': schoolCategoryCount
        };
      });
    }
  };
  
  const chartData = getChartData();
  const barColors = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Benchmarking</h1>
          <p className="text-gray-600 mt-1">Compare your school's incidents with city-wide averages</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Multi-City Benchmarking</CardTitle>
                <CardDescription>
                  Compare your school's data with multiple cities across the region
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={showSubcategories ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowSubcategories(true)}
                >
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Subcategories
                </Button>
                <Button 
                  variant={!showSubcategories ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setShowSubcategories(false)}
                >
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Summary
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="space-y-4 md:col-span-1">
                <div>
                  <label className="block text-sm font-medium mb-2">Incident Category</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={(value) => setSelectedCategory(value as IncidentCategory)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Filter className="h-4 w-4 inline mr-1" />
                    Select Cities to Compare
                  </label>
                  <div className="space-y-2 border rounded-md p-3">
                    {cityNames.map(city => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`city-${city}`} 
                          checked={selectedCities.includes(city)}
                          onCheckedChange={() => toggleCity(city)}
                        />
                        <label htmlFor={`city-${city}`} className="text-sm">
                          {city}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mt-4 border">
                  <h4 className="text-sm font-medium mb-1">Analysis Tips</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Compare your data across multiple cities</li>
                    <li>• Toggle between summary and detailed views</li>
                    <li>• Look for trends and outliers in specific categories</li>
                  </ul>
                </div>
              </div>
              
              <div className="md:col-span-3">
                <Tabs defaultValue="chart">
                  <TabsList>
                    <TabsTrigger value="chart">Chart View</TabsTrigger>
                    <TabsTrigger value="table">Table View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="chart" className="pt-4">
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
                  </TabsContent>
                  
                  <TabsContent value="table" className="pt-4">
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                              {showSubcategories ? "Subcategory" : "City"}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Your School</th>
                            
                            {showSubcategories ? (
                              selectedCities.map(city => (
                                <th key={city} className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                                  {city}
                                </th>
                              ))
                            ) : (
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">City Average</th>
                            )}
                            
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Difference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {chartData.length > 0 ? (
                            chartData.map((item, index) => {
                              const yourSchool = item['Your School'] || 0;
                              const comparison = showSubcategories 
                                ? selectedCities.length > 0 
                                  ? selectedCities.reduce((sum, city) => sum + (item[city] || 0), 0) / selectedCities.length 
                                  : 0
                                : item['City Average'] || 0;
                                
                              const difference = yourSchool - comparison;
                              const isHigher = difference > 0;
                              
                              return (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                  <td className="px-4 py-3 text-sm">{yourSchool}</td>
                                  
                                  {showSubcategories ? (
                                    selectedCities.map(city => (
                                      <td key={city} className="px-4 py-3 text-sm">
                                        {item[city] || 0}
                                      </td>
                                    ))
                                  ) : (
                                    <td className="px-4 py-3 text-sm">{comparison}</td>
                                  )}
                                  
                                  <td className={`px-4 py-3 text-sm font-medium ${isHigher ? 'text-red-600' : 'text-green-600'}`}>
                                    {difference === 0 ? 'Equal' : `${isHigher ? '+' : ''}${difference.toFixed(1)}`}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td className="px-4 py-3 text-sm text-gray-500 text-center" colSpan={4 + (showSubcategories ? selectedCities.length : 0)}>
                                No data available for the selected category
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium mb-2">About Benchmarking Data</h4>
              <p className="text-xs text-gray-600">
                This anonymized data is collected from schools across multiple cities to help you compare your safety 
                performance regionally. All personal information has been removed and data is aggregated to protect privacy.
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

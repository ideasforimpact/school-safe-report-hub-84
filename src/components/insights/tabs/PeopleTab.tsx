
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PersonData {
  name: string;
  id: string;
  role: string;
  incidents: Array<{
    id: string;
    date: string;
    type: string;
    category: string;
    subcategory: string;
    status: string;
  }>;
  count: number;
}

interface PeopleTabProps {
  roleDistributionData: Array<{name: string, value: number}>;
  peopleData: PersonData[];
  colors: string[];
}

const PeopleTab: React.FC<PeopleTabProps> = ({ roleDistributionData, peopleData, colors }) => {
  return (
    <div className="space-y-6 mt-4">
      <Card>
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
      
      <Card>
        <CardHeader>
          <CardTitle>People Involved in Incidents</CardTitle>
          <CardDescription>
            Detailed breakdown of incidents by person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Incidents</TableHead>
                <TableHead>Last Incident</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peopleData.length > 0 ? (
                peopleData.map((person) => {
                  // Find the most recent incident
                  const sortedIncidents = [...person.incidents].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                  const mostRecent = sortedIncidents[0];
                  
                  return (
                    <TableRow key={`${person.name}-${person.role}`}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.id}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          person.role === 'Student' 
                            ? 'bg-blue-100 text-blue-800'
                            : person.role === 'Staff' || person.role === 'Teacher'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {person.role || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{person.incidents.length}</TableCell>
                      <TableCell>{mostRecent ? new Date(mostRecent.date).toLocaleDateString() : 'N/A'}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No data available for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeopleTab;

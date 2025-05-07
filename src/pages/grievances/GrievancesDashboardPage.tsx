
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const GrievancesDashboardPage = () => {
  const { submissions } = useGrievance();

  // Prepare data for charts
  const getStatusCounts = () => {
    const counts = { new: 0, in_progress: 0, resolved: 0, closed: 0 };
    submissions.forEach(submission => {
      counts[submission.status] += 1;
    });
    return [
      { name: 'New', value: counts.new },
      { name: 'In Progress', value: counts.in_progress },
      { name: 'Resolved', value: counts.resolved },
      { name: 'Closed', value: counts.closed },
    ];
  };

  const getTypeDistribution = () => {
    const types: Record<string, number> = {};
    submissions.forEach(submission => {
      const typeResponse = submission.responses.find(r => r.question === 'Grievance Type');
      if (typeResponse) {
        const type = typeResponse.answer;
        types[type] = (types[type] || 0) + 1;
      }
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  };

  const getSubmissionsByMonth = () => {
    const months: Record<string, number> = {};
    submissions.forEach(submission => {
      const date = new Date(submission.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] || 0) + 1;
    });
    
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ 
        month,
        count
      }));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Recent submissions for display
  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Compute resolution rate
  const totalResolved = submissions.filter(s => s.status === 'resolved' || s.status === 'closed').length;
  const resolutionRate = submissions.length > 0 
    ? Math.round((totalResolved / submissions.length) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Grievances Dashboard</h1>
          </div>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/grievances">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Grievances</span>
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Grievances</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{submissions.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Grievances</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{submissions.filter(s => s.status === 'new' || s.status === 'in_progress').length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{resolutionRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">2.4 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Grievances by Status</CardTitle>
              <CardDescription>Current distribution of grievances by status</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getStatusCounts()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusCounts().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grievance Types</CardTitle>
              <CardDescription>Distribution by grievance category</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getTypeDistribution()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grievance Submission Trend</CardTitle>
            <CardDescription>Monthly submission volume</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getSubmissionsByMonth()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} name="Submissions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GrievancesDashboardPage;

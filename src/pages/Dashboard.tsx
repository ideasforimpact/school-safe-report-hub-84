
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ChartPie, List } from 'lucide-react';

const Dashboard = () => {
  const { incidents } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate summary statistics
  const openIncidents = incidents.filter(inc => inc.status === 'Open').length;
  
  // Current month incidents
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const incidentsThisMonth = incidents.filter(inc => {
    const incDate = new Date(inc.date);
    return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
  }).length;
  
  // Most common category
  const categoryCounts = incidents.reduce((acc, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  
  // Recent incidents (5 most recent)
  const recentIncidents = [...incidents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600 mt-1">Track, manage, and analyze school safety incidents</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Open Incidents</CardTitle>
              <CardDescription>Awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-primary-700">{openIncidents}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">This Month</CardTitle>
              <CardDescription>Recent incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-primary-700">{incidentsThisMonth}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Common Category</CardTitle>
              <CardDescription>Most reported</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-primary-700 truncate">{mostCommonCategory}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-full md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700"
                onClick={() => navigate('/report')}
              >
                <AlertTriangle size={24} />
                <span>Report New Incident</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700"
                onClick={() => navigate('/incidents')}
              >
                <List size={24} />
                <span>View All Incidents</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700"
                onClick={() => navigate('/insights')}
              >
                <ChartPie size={24} />
                <span>View Insights</span>
              </Button>
            </div>
            
            <h2 className="text-xl font-semibold pt-4">Recent Incidents</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {recentIncidents.length > 0 ? (
                <div className="divide-y">
                  {recentIncidents.map(incident => (
                    <div 
                      key={incident.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                    >
                      <div>
                        <p className="font-medium">{incident.type}: {incident.category}</p>
                        <p className="text-sm text-gray-600 truncate max-w-md">{incident.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        incident.status === 'Open' 
                          ? 'bg-red-100 text-red-800' 
                          : incident.status === 'In Progress' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {incident.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No incidents reported yet
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-full md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Safety Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded p-3 bg-blue-50">
                  <h3 className="font-medium">Emergency Procedures</h3>
                  <p className="text-sm">Review the latest emergency protocols and procedures</p>
                </div>
                
                <div className="border rounded p-3 bg-green-50">
                  <h3 className="font-medium">Training Materials</h3>
                  <p className="text-sm">Access staff training resources for incident response</p>
                </div>
                
                <div className="border rounded p-3 bg-orange-50">
                  <h3 className="font-medium">Contact Directory</h3>
                  <p className="text-sm">Important contacts for emergency situations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

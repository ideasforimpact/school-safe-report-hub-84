
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ChartPie, List, Clock, TrendingUp, Users, School, Calendar, ActivityIcon } from 'lucide-react';
import { formatDistance } from 'date-fns';
import IncidentStatusChart from '@/components/charts/IncidentStatusChart';

const Dashboard = () => {
  const { incidents, getRecentActivities } = useIncidents();
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
  
  // Get recent activities
  const recentActivities = getRecentActivities();

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 w-full">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Track, manage, and analyze school safety incidents</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg font-medium">Open Incidents</CardTitle>
                <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </div>
              </div>
              <CardDescription>Awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-semibold text-primary-700">{openIncidents}</p>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
                <div className="h-2 bg-primary-500 rounded-full" style={{width: `${Math.min(100, (openIncidents / Math.max(incidents.length, 1)) * 100)}%`}}></div>
              </div>
              <p className="text-xs text-gray-500">{Math.round((openIncidents / Math.max(incidents.length, 1)) * 100)}% of total incidents</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg font-medium">This Month</CardTitle>
                <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
              </div>
              <CardDescription>Recent incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-semibold text-primary-700">{incidentsThisMonth}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-xs md:text-sm text-green-600">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  <span>12% increase</span>
                </div>
                <span className="text-xs text-gray-500">from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg font-medium">Common Category</CardTitle>
                <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <ActivityIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
              </div>
              <CardDescription>Most reported</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg md:text-xl font-semibold text-primary-700 truncate">{mostCommonCategory}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500">
                  {categoryCounts[mostCommonCategory] || 0} incidents reported
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg font-medium">People Involved</CardTitle>
                <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
              </div>
              <CardDescription>Total affected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-semibold text-primary-700">
                {incidents.reduce((total, inc) => total + (inc.peopleInvolved?.length || 0), 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-gray-500">
                  Across all incidents
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <Card className="border-none shadow-card h-full">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-medium">Incident Status</CardTitle>
              </CardHeader>
              <CardContent>
                <IncidentStatusChart />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-medium text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
                onClick={() => navigate('/report')}
              >
                <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                </div>
                <span className="text-xs md:text-sm text-center">Report New Incident</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
                onClick={() => navigate('/incidents')}
              >
                <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <List className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <span className="text-xs md:text-sm text-center">View All Incidents</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 hover:bg-primary-50 hover:text-primary-700 border-none shadow-card hover:shadow-card-hover"
                onClick={() => navigate('/insights')}
              >
                <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
                  <ChartPie className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <span className="text-xs md:text-sm text-center">View Insights</span>
              </Button>
            </div>
            
            <h2 className="text-lg md:text-xl font-medium text-gray-900 pt-2 md:pt-4">Recent Activities</h2>
            <Card className="border-none shadow-card">
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((activity, index) => (
                    <div 
                      key={index} 
                      className="p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        if (activity.type === 'incident') {
                          navigate(`/incidents/${activity.entityId}`);
                        } else if (activity.type === 'action') {
                          // Find the incident that contains this action item
                          const incident = incidents.find(inc => 
                            inc.actionItems?.some(item => item.id === activity.entityId)
                          );
                          if (incident) {
                            navigate(`/incidents/${incident.id}`);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className={`p-1.5 md:p-2 rounded-full ${
                          activity.type === 'incident' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm md:text-base">
                            {activity.activity === 'create' ? 'Created' : 'Updated'} {' '}
                            {activity.type === 'incident' ? 'incident' : 'action item'}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 truncate max-w-xs md:max-w-md mt-0.5 md:mt-1">
                            {activity.entityTitle}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 md:mt-1">
                            by {activity.user} • {formatDistance(new Date(activity.date), new Date(), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400 ml-1 md:ml-2 shrink-0">
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 md:p-6 text-center text-gray-500 text-sm md:text-base">
                  No recent activity
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="col-span-full">
          <Card className="border-none shadow-card">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-medium">Safety Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <div className="bg-blue-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                      <School className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">Emergency Procedures</h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Review the latest emergency protocols and procedures</p>
                </div>
                
                <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <div className="bg-green-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">Training Materials</h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Access staff training resources for incident response</p>
                </div>
                
                <div className="p-3 md:p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                    <div className="bg-amber-100 h-7 w-7 md:h-8 md:w-8 rounded-full flex items-center justify-center">
                      <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">Contact Directory</h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Important contacts for emergency situations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

// Missing import for Phone and ChevronRight icons
import { Phone, ChevronRight } from 'lucide-react';

export default Dashboard;

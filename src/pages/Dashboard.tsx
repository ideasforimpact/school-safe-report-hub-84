
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { incidents, getRecentActivities } = useIncidents();
  const recentActivities = getRecentActivities().slice(0, 5);

  // Format date to be more readable
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Calculate statistics for the dashboard
  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter(incident => incident.status === 'Open').length;
  const inProgressIncidents = incidents.filter(incident => incident.status === 'In Progress').length;
  const closedIncidents = incidents.filter(incident => incident.status === 'Closed').length;
  
  // Safety stats - assuming we can calculate these from our data
  const incidentFreeStreak = 14; // Placeholder for "days without incident"
  const reportRate = 92; // Placeholder for reporting rate percentage
  
  // Calculate resolution time in days (average)
  const calculateAverageResolutionTime = () => {
    const closedIncidentsWithDates = incidents.filter(
      i => i.status === 'Closed' && i.createdAt && i.updatedAt
    );
    
    if (closedIncidentsWithDates.length === 0) return 0;
    
    const totalDays = closedIncidentsWithDates.reduce((sum, incident) => {
      const createdDate = new Date(incident.createdAt);
      const closedDate = new Date(incident.updatedAt);
      const diffTime = Math.abs(closedDate.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return Math.round(totalDays / closedIncidentsWithDates.length);
  };

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* If no incidents yet, show a welcome message */}
        {totalIncidents === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to the Safety Management System</AlertTitle>
            <AlertDescription>
              Get started by reporting your first incident or exploring the system's features.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Dashboard Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Incident Status Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalIncidents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{openIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {openIncidents > 0 ? `${Math.round((openIncidents / totalIncidents) * 100) || 0}% of total` : 'No open incidents'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{inProgressIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {inProgressIncidents > 0 ? `${Math.round((inProgressIncidents / totalIncidents) * 100) || 0}% of total` : 'No incidents in progress'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{closedIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {closedIncidents > 0 ? `${Math.round((closedIncidents / totalIncidents) * 100) || 0}% of total` : 'No resolved incidents'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional dashboard content would go here */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <ActivityList 
                  activities={recentActivities} 
                  formatDate={formatDate} 
                />
              ) : (
                <p className="text-muted-foreground text-sm">No recent activity to display</p>
              )}
            </CardContent>
          </Card>
          
          {/* Safety Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Safety Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Without Incident</p>
                <p className="text-2xl font-bold">{incidentFreeStreak}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reporting Rate</p>
                <p className="text-2xl font-bold">{reportRate}%</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</p>
                <p className="text-2xl font-bold">{calculateAverageResolutionTime()} days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

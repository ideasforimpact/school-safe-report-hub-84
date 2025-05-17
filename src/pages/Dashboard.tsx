
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import { formatDistanceToNow } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SafetyResources from '@/components/dashboard/SafetyResources';
import IntegratedDashboardSection from '@/components/dashboard/IntegratedDashboardSection';

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

  // Calculate most common category and category counts
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {};
    incidents.forEach(incident => {
      const category = incident.category || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();
  const mostCommonCategory = Object.keys(categoryCounts).reduce(
    (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
    'Uncategorized'
  );

  // Count total people involved
  const totalPeopleInvolved = incidents.reduce(
    (sum, incident) => sum + (incident.peopleInvolved?.length || 0),
    0
  );

  // Data for the integrated dashboard section
  const openIncidentsData = {
    count: openIncidents,
    change: -5 // placeholder for % change
  };

  // Handler for activity clicks
  const handleActivityClick = (activity: any) => {
    console.log("Activity clicked:", activity);
    // Navigate or show details as needed
  };

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        <h1 className="text-2xl font-bold">Safety Dashboard</h1>
        
        {/* If no incidents yet, show a welcome message */}
        {totalIncidents === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to the Safety Management System</AlertTitle>
            <AlertDescription>
              Get started by reporting your first incident or exploring the system's features.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Integrated Dashboard Overview */}
        <IntegratedDashboardSection openIncidentsData={openIncidentsData} />
        
        {/* Dashboard Cards */}
        <SummaryCards 
          openIncidents={openIncidents}
          totalIncidents={totalIncidents}
          incidentsThisMonth={inProgressIncidents} // Using in progress as placeholder
          mostCommonCategory={mostCommonCategory}
          categoryCounts={categoryCounts}
          totalPeopleInvolved={totalPeopleInvolved}
        />
        
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Two column layout for activities and resources */}
        <div className="grid gap-8 md:grid-cols-2">
          <RecentActivities 
            activities={recentActivities}
            onActivityClick={handleActivityClick}
          />
          
          <SafetyResources />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

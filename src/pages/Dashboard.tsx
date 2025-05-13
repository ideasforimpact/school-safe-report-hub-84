
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import SummaryCards from '@/components/dashboard/SummaryCards';
import IncidentStatusSection from '@/components/dashboard/IncidentStatusSection';
import SafetyResources from '@/components/dashboard/SafetyResources';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { incidents, getRecentActivities } = useIncidents();
  const { user, isSaasOwner } = useAuth();
  const navigate = useNavigate();

  // School name that would come from backend in a real implementation
  const schoolName = isSaasOwner ? "All Schools" : "Raks Pallikkoodam";

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
  
  // Total people involved
  const totalPeopleInvolved = incidents.reduce((total, inc) => total + (inc.peopleInvolved?.length || 0), 0);

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome to {schoolName} Safety Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Track, manage, and analyze school safety incidents</p>
          </div>
          
          <Button onClick={() => navigate('/report-incident')} className="whitespace-nowrap">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report New Incident
          </Button>
        </div>

        {/* Summary Cards Section */}
        <SummaryCards 
          openIncidents={openIncidents}
          totalIncidents={incidents.length}
          incidentsThisMonth={incidentsThisMonth}
          mostCommonCategory={mostCommonCategory}
          categoryCounts={categoryCounts}
          totalPeopleInvolved={totalPeopleInvolved}
        />
        
        {/* Insights Grid - Replace QuickActions and RecentActivities with more insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Incident Status Chart */}
          <div>
            <IncidentStatusSection />
          </div>
          
          {/* Category Distribution */}
          <div>
            <IncidentStatusSection title="Category Distribution" />
          </div>
          
          {/* Monthly Trend */}
          <div>
            <IncidentStatusSection title="Monthly Trend" />
          </div>
        </div>

        {/* Safety Resources Section */}
        <div className="col-span-full">
          <SafetyResources />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

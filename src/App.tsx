
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ReportIncident from '@/pages/ReportIncident';
import IncidentsList from '@/pages/IncidentsList';
import IncidentDetail from '@/pages/IncidentDetail';
import EditIncident from '@/pages/EditIncident';
import MyActionItems from '@/pages/MyActionItems';
import Insights from '@/pages/Insights';
import UserManagement from '@/pages/UserManagement';
import FacilityManagement from '@/pages/FacilityManagement';
import ConfigurationManagement from '@/pages/ConfigurationManagement';
import ClientManagement from '@/pages/ClientManagement';
import BackofficeDashboard from '@/pages/backoffice/BackofficeDashboard';
import BackofficeAnalytics from '@/pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from '@/pages/backoffice/BackofficeSettings';
import NotFound from '@/pages/NotFound';
import Support from '@/pages/Support';
import Pricing from '@/pages/Pricing';
import Blog from '@/pages/Blog';
import Benchmarking from '@/pages/Benchmarking';
import { AuthProvider } from '@/contexts/AuthContext';
import { IncidentProvider } from '@/contexts/IncidentContext';
import { FacilityProvider } from '@/contexts/FacilityContext';
import { ClientProvider } from '@/contexts/ClientContext';
import RouteGuard from '@/components/RouteGuard';
import ModuleGuard from '@/components/ModuleGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientProvider>
          <FacilityProvider>
            <IncidentProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/support" element={<Support />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/blog" element={<Blog />} />
                
                {/* Backoffice Routes */}
                <Route path="/backoffice" element={<BackofficeDashboard />} />
                <Route path="/backoffice/analytics" element={<BackofficeAnalytics />} />
                <Route path="/backoffice/settings" element={<BackofficeSettings />} />
                <Route path="/backoffice/clients" element={<ClientManagement />} />
                
                <Route element={<RouteGuard />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  <Route element={<ModuleGuard moduleType="incidentReporting" />}>
                    <Route path="/report" element={<ReportIncident />} />
                  </Route>
                  
                  <Route element={<ModuleGuard moduleType="allIncidents" />}>
                    <Route path="/incidents" element={<IncidentsList />} />
                    <Route path="/incidents/:id" element={<IncidentDetail />} />
                    <Route path="/incidents/:id/edit" element={<EditIncident />} />
                  </Route>
                  
                  <Route path="/my-actions" element={<MyActionItems />} />
                  
                  <Route element={<ModuleGuard moduleType="insights" />}>
                    <Route path="/insights" element={<Insights />} />
                  </Route>
                  
                  <Route element={<ModuleGuard moduleType="benchmarking" />}>
                    <Route path="/benchmarking" element={<Benchmarking />} />
                  </Route>
                  
                  <Route element={<RouteGuard requireAdmin={true} />}>
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/facilities" element={<FacilityManagement />} />
                    <Route path="/configuration" element={<ConfigurationManagement />} />
                    <Route path="/clients" element={<ClientManagement />} />
                  </Route>
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </IncidentProvider>
          </FacilityProvider>
        </ClientProvider>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

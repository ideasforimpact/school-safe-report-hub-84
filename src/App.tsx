
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
import ConfigurationManagement from '@/pages/ConfigurationManagement'; // Add this line
import NotFound from '@/pages/NotFound';
import Support from '@/pages/Support';
import Pricing from '@/pages/Pricing';
import Blog from '@/pages/Blog';
import Benchmarking from '@/pages/Benchmarking';
import { AuthProvider } from '@/contexts/AuthContext';
import { IncidentProvider } from '@/contexts/IncidentContext';
import { FacilityProvider } from '@/contexts/FacilityContext';
import RouteGuard from '@/components/RouteGuard';
import ModuleGuard from '@/components/ModuleGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FacilityProvider>
          <IncidentProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/support" element={<Support />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              
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
                  <Route path="/configuration" element={<ConfigurationManagement />} /> {/* Add this line */}
                </Route>
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </IncidentProvider>
        </FacilityProvider>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

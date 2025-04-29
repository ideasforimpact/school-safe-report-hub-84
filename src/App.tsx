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
import NotFound from '@/pages/NotFound';
import Support from '@/pages/Support';
import Pricing from '@/pages/Pricing';
import Blog from '@/pages/Blog';
import Benchmarking from '@/pages/Benchmarking';
import { AuthContextProvider } from '@/contexts/AuthContext';
import { IncidentContextProvider } from '@/contexts/IncidentContext';
import { FacilityContextProvider } from '@/contexts/FacilityContext';
import RouteGuard from '@/components/RouteGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <FacilityContextProvider>
          <IncidentContextProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/support" element={<Support />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              
              <Route element={<RouteGuard />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/report" element={<ReportIncident />} />
                <Route path="/incidents" element={<IncidentsList />} />
                <Route path="/incidents/:id" element={<IncidentDetail />} />
                <Route path="/incidents/:id/edit" element={<EditIncident />} />
                <Route path="/my-actions" element={<MyActionItems />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/benchmarking" element={<Benchmarking />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/facilities" element={<FacilityManagement />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </IncidentContextProvider>
        </FacilityContextProvider>
      </AuthContextProvider>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;

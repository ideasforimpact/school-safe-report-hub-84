
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncidentsList from './pages/IncidentsList';
import ReportIncident from './pages/ReportIncident';
import IncidentDetail from './pages/IncidentDetail';
import EditIncident from './pages/EditIncident';
import Insights from './pages/Insights';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/auth/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { FacilityProvider } from './contexts/FacilityContext';
import { IncidentProvider } from './contexts/IncidentContext';
import { StudentProvider } from './contexts/StudentContext';
import RouteGuard from './components/RouteGuard';
import ModuleGuard from './components/ModuleGuard';
import ConfigurationManagement from './pages/ConfigurationManagement';
import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import Support from './pages/Support';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import FacilityManagement from './pages/FacilityManagement';
import ClientManagement from './pages/ClientManagement';
import Benchmarking from './pages/Benchmarking';
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientProvider>
          <FacilityProvider>
            <IncidentProvider>
              <StudentProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/support" element={<Support />} />
                  
                  {/* Protected Routes */}
                  <Route element={<RouteGuard />}>
                    <Route element={<ModuleGuard />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/incidents" element={<IncidentsList />} />
                      <Route path="/incident/:id" element={<IncidentDetail />} />
                      <Route path="/incident/:id/edit" element={<EditIncident />} />
                      <Route path="/report-incident" element={<ReportIncident />} />
                      <Route path="/insights" element={<Insights />} />
                      <Route path="/configuration" element={<ConfigurationManagement />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/students" element={<StudentManagement />} />
                      <Route path="/facilities" element={<FacilityManagement />} />
                      <Route path="/clients" element={<ClientManagement />} />
                      <Route path="/benchmarking" element={<Benchmarking />} />
                    </Route>
                    
                    {/* Backoffice Routes */}
                    <Route path="/backoffice/dashboard" element={<BackofficeDashboard />} />
                    <Route path="/backoffice/analytics" element={<BackofficeAnalytics />} />
                    <Route path="/backoffice/settings" element={<BackofficeSettings />} />
                  </Route>
                  
                  {/* Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </StudentProvider>
            </IncidentProvider>
          </FacilityProvider>
        </ClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

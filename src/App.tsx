
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import EditIncident from './pages/EditIncident';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import ConfigurationManagement from './pages/configuration/ConfigurationManagement';
import IncidentConfiguration from './pages/IncidentConfiguration';
import CategoryConfiguration from './pages/CategoryConfiguration';
import { IncidentProvider } from './contexts/IncidentContext';
import { FacilityProvider } from './contexts/FacilityContext';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import BackofficeLayout from './components/layout/BackofficeLayout';
import EducationalConfiguration from './pages/EducationalConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';
import { ClientProvider } from './contexts/ClientContext';
import Insights from './pages/Insights';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import UserManagement from './pages/UserManagement';
import RouteGuard from './components/RouteGuard';
import ModuleGuard from './components/ModuleGuard';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ClientProvider>
          <IncidentProvider>
            <FacilityProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes - require authentication */}
                <Route element={<RouteGuard />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Incident routes with module guards */}
                  <Route element={<ModuleGuard moduleType="incidentReporting" />}>
                    <Route path="/report-incident" element={<ReportIncident />} />
                  </Route>
                  
                  <Route element={<ModuleGuard moduleType="allIncidents" />}>
                    <Route path="/incidents" element={<IncidentsList />} />
                    <Route path="/edit-incident/:id" element={<EditIncident />} />
                    <Route path="/incident/:id" element={<IncidentDetail />} />
                  </Route>
                  
                  <Route element={<ModuleGuard moduleType="insights" />}>
                    <Route path="/insights" element={<Insights />} />
                  </Route>
                  
                  {/* Admin-only routes */}
                  <Route element={<RouteGuard requireAdmin />}>
                    <Route path="/configuration" element={<ConfigurationManagement />} />
                    <Route path="/incident-configuration" element={<IncidentConfiguration />} />
                    <Route path="/category-configuration" element={<CategoryConfiguration />} />
                    <Route path="/educational-configuration" element={<EducationalConfiguration />} />
                    <Route path="/other-configuration" element={<OtherConfiguration />} />
                    <Route path="/user-management" element={<UserManagement />} />
                  </Route>
                </Route>
                
                {/* Backoffice routes */}
                <Route path="/backoffice" element={<BackofficeLayout><Dashboard /></BackofficeLayout>} />
                <Route path="/backoffice/analytics" element={<BackofficeLayout><BackofficeAnalytics /></BackofficeLayout>} />
              </Routes>
            </FacilityProvider>
          </IncidentProvider>
        </ClientProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;


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

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ClientProvider>
          <IncidentProvider>
            <FacilityProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/incidents" element={<IncidentsList />} />
                <Route path="/report-incident" element={<ReportIncident />} />
                <Route path="/edit-incident/:id" element={<EditIncident />} />
                <Route path="/incident/:id" element={<IncidentDetail />} />
                <Route path="/configuration" element={<ConfigurationManagement />} />
                <Route path="/incident-configuration" element={<IncidentConfiguration />} />
                
                {/* Configuration routes */}
                <Route path="/category-configuration" element={<CategoryConfiguration />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Educational & Other Configuration */}
                <Route path="/educational-configuration" element={<EducationalConfiguration />} />
                <Route path="/other-configuration" element={<OtherConfiguration />} />
                
                {/* Backoffice route with layout */}
                <Route path="/backoffice" element={<BackofficeLayout><Dashboard /></BackofficeLayout>} />
              </Routes>
            </FacilityProvider>
          </IncidentProvider>
        </ClientProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

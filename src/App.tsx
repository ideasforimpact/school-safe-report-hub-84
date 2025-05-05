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
import LocationFacilityConfiguration from './pages/LocationFacilityConfiguration';
import { IncidentProvider } from './contexts/IncidentContext';
import { FacilityProvider } from './contexts/FacilityContext';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';
import BackofficeLayout from './components/layout/BackofficeLayout';
import Clients from './pages/backoffice/Clients';
import Analytics from './pages/backoffice/Analytics';
import Settings from './pages/backoffice/Settings';
import Users from './pages/backoffice/Users';
import Students from './pages/backoffice/Students';
import EducationalConfiguration from './pages/EducationalConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
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
              
              {/* New configuration routes */}
              <Route path="/category-configuration" element={<CategoryConfiguration />} />
              <Route path="/location-facility-configuration" element={<LocationFacilityConfiguration />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Backoffice routes - example with layout */}
              <Route path="/backoffice" element={<BackofficeLayout><Dashboard /></BackofficeLayout>} />
              <Route path="/backoffice/clients" element={<BackofficeLayout><Clients /></BackofficeLayout>} />
              <Route path="/backoffice/analytics" element={<BackofficeLayout><Analytics /></BackofficeLayout>} />
              <Route path="/backoffice/settings" element={<BackofficeLayout><Settings /></BackofficeLayout>} />
              <Route path="/users" element={<Users />} />
              <Route path="/students" element={<Students />} />
              <Route path="/educational-configuration" element={<EducationalConfiguration />} />
              <Route path="/other-configuration" element={<OtherConfiguration />} />
            </Routes>
          </FacilityProvider>
        </IncidentProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;

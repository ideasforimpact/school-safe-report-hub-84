import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { ThemeProvider } from "@/components/theme-provider"
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import Configuration from './pages/Configuration';
import Grievances from './pages/Grievances';
import GrievanceDetails from './pages/GrievanceDetails';
import GrievanceSubmission from './pages/GrievanceSubmission';
import EnhancedGrievanceSubmission from './pages/EnhancedGrievanceSubmission';
import EnhancedGrievanceDetails from './pages/EnhancedGrievanceDetails';
import Login from './pages/Login';
import Protected from './components/auth/Protected';
import { Toaster } from "@/components/ui/toaster"
import { IncidentProvider } from './contexts/IncidentContext';
import Users from './pages/Users';
import EditIncident from './features/edit-incident/EditIncident';
import IncidentReport from './pages/IncidentReport';

function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <IncidentProvider>
          <ThemeProvider>
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <Protected>
                  <Dashboard />
                </Protected>
              } />
              <Route path="/dashboard" element={
                <Protected>
                  <Dashboard />
                </Protected>
              } />
              <Route path="/incidents" element={
                <Protected>
                  <Incidents />
                </Protected>
              } />
              <Route path="/incidents/:id" element={
                <Protected>
                  <EditIncident />
                </Protected>
              } />
              <Route path="/configuration" element={
                <Protected>
                  <Configuration />
                </Protected>
              } />
              <Route path="/grievances" element={
                <Protected>
                  <Grievances />
                </Protected>
              } />
              <Route path="/grievances/:id" element={
                <Protected>
                  <EnhancedGrievanceDetails />
                </Protected>
              } />
              <Route path="/grievances/submit" element={
                <Protected>
                  <GrievanceSubmission />
                </Protected>
              } />
              <Route path="/grievances/enhanced-submit" element={
                <Protected>
                  <EnhancedGrievanceSubmission />
                </Protected>
              } />
              <Route path="/users" element={
                <Protected>
                  <Users />
                </Protected>
              } />
              <Route path="/incident-report" element={
                <Protected>
                  <IncidentReport />
                </Protected>
              } />
            </Routes>
          </ThemeProvider>
        </IncidentProvider>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;

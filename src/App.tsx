import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { EmployeeProvider } from './contexts/employee/EmployeeContext';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import UserManagement from '@/pages/UserManagement';
import ClientManagement from '@/pages/ClientManagement';
import EmployeeManagement from '@/pages/EmployeeManagement';
import EmployeeVerificationPage from '@/pages/employee-verification/EmployeeVerificationPage';
import EmployeeVerificationDashboard from '@/pages/employee-verification/EmployeeVerificationDashboard';
import EmployeeVerificationDetails from '@/pages/employee-verification/EmployeeVerificationDetails';
import IncidentReporting from '@/pages/IncidentReporting';
import IncidentDetails from '@/pages/IncidentDetails';
import IncidentDashboard from '@/pages/IncidentDashboard';
import AssessmentDashboard from '@/pages/AssessmentDashboard';
import AssessmentDetails from '@/pages/AssessmentDetails';
import AssessmentForm from '@/pages/AssessmentForm';
import AssessmentResults from '@/pages/AssessmentResults';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

// Auth components
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="edusafe-theme">
      <ClientProvider>
        <AuthProvider>
          <EmployeeProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/clients" element={<ClientManagement />} />
                  <Route path="/employees" element={<EmployeeManagement />} />
                  <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
                  <Route path="/employee-verification/dashboard" element={<EmployeeVerificationDashboard />} />
                  <Route path="/employee-verification/:id" element={<EmployeeVerificationDetails />} />
                  <Route path="/incidents" element={<IncidentReporting />} />
                  <Route path="/incidents/:id" element={<IncidentDetails />} />
                  <Route path="/incidents/dashboard" element={<IncidentDashboard />} />
                  <Route path="/assessments" element={<AssessmentDashboard />} />
                  <Route path="/assessments/:id" element={<AssessmentDetails />} />
                  <Route path="/assessments/new" element={<AssessmentForm />} />
                  <Route path="/assessments/:id/results" element={<AssessmentResults />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster position="top-right" />
          </EmployeeProvider>
        </AuthProvider>
      </ClientProvider>
    </ThemeProvider>
  );
}

export default App;


import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/auth';
import RouteGuard from './components/RouteGuard';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import ModuleGuard from './components/ModuleGuard';
import ProfilePage from './components/profile/ProfilePage';

// Import placeholder components for pages that don't exist in the codebase
const DashboardPage = () => <div>Dashboard Page</div>;
const IncidentsPage = () => <div>Incidents Page</div>;
const NewIncidentPage = () => <div>New Incident Page</div>;
const IncidentDetailPage = () => <div>Incident Detail Page</div>;
const LoginPage = () => <div>Login Page</div>;
const PasswordResetPage = () => <div>Password Reset Page</div>;
const ForgotPasswordPage = () => <div>Forgot Password Page</div>;

const App = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      
      {/* Auth routes */}
      <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
      <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
      <Route path="/reset-password" element={<PublicLayout><PasswordResetPage /></PublicLayout>} />
      
      {/* Protected routes */}
      <Route element={<RouteGuard />}>
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        
        {/* Profile route */}
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        
        {/* Incident routes */}
        <Route element={<ModuleGuard moduleType="incidentReporting" />}>
          <Route path="/incidents" element={<Layout><IncidentsPage /></Layout>} />
          <Route path="/incidents/new" element={<Layout><NewIncidentPage /></Layout>} />
          <Route path="/incidents/:id" element={<Layout><IncidentDetailPage /></Layout>} />
        </Route>
      </Route>
      
      {/* Backoffice routes */}
      <Route path="/backoffice/*" element={<Outlet />}>
        <Route index element={<Navigate to="/backoffice/dashboard" replace />} />
        <Route path="dashboard" element={<Layout><DashboardPage /></Layout>} />
      </Route>
      
      {/* Not found route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;

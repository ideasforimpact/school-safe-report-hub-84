
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import NotFound from './pages/NotFound';
import { useAuth } from './contexts/auth';
import RouteGuard from './components/RouteGuard';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import ModuleGuard from './components/ModuleGuard';
import ProfilePage from './components/profile/ProfilePage'; // This import is correct

// Import pages that were causing errors - using relative paths to actual files
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import PasswordResetPage from './pages/auth/PasswordResetPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/Dashboard';
import IncidentsPage from './pages/IncidentsList';
import NewIncidentPage from './pages/ReportIncident';
import IncidentDetailPage from './pages/IncidentDetail';

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

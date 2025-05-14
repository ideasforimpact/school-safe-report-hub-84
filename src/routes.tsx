import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncidentsList from './pages/IncidentsList';
import ReportIncident from './pages/ReportIncident';
import IncidentDetail from './pages/IncidentDetail';
import Insights from './pages/Insights';
import EditIncident from './pages/EditIncident';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import Support from './pages/Support';
import NewsPage from './pages/NewsPage';
import Benchmarking from './pages/Benchmarking';
import ConfigurationManagement from './pages/configuration/ConfigurationManagement';
import EducationalConfiguration from './pages/EducationalConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';
import EmployeeManagement from './pages/EmployeeManagement';
import StudentManagement from './pages/StudentManagement';
import FacilityManagement from './pages/FacilityManagement';
import ClientManagement from './pages/ClientManagement';
import IncidentConfiguration from './pages/IncidentConfiguration';

// Import backoffice pages
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';
import AssessmentTemplatesManagementPage from './pages/backoffice/AssessmentTemplatesManagementPage';
import EduSafeResourcesManagementPage from './pages/backoffice/EduSafeResourcesManagementPage';

// Import routes from modules - fix the missing default export 
import * as assessmentRoutes from './routes/assessmentRoutes';
import RouteGuard from './components/RouteGuard';
import PublicLayout from './components/layout/PublicLayout';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout children={null} />}>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected Routes - These routes require authentication */}
        <Route
          path="/dashboard"
          element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/incidents"
          element={
            <RouteGuard>
              <IncidentsList />
            </RouteGuard>
          }
        />
        <Route
          path="/report-incident"
          element={
            <RouteGuard>
              <ReportIncident />
            </RouteGuard>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <RouteGuard>
              <IncidentDetail />
            </RouteGuard>
          }
        />
        <Route
          path="/insights"
          element={
            <RouteGuard>
              <Insights />
            </RouteGuard>
          }
        />
        <Route
          path="/edit-incident/:id"
          element={
            <RouteGuard>
              <EditIncident />
            </RouteGuard>
          }
        />
        <Route
          path="/benchmarking"
          element={
            <RouteGuard>
              <Benchmarking />
            </RouteGuard>
          }
        />
        <Route
          path="/configuration"
          element={
            <RouteGuard>
              <Navigate to="/configuration/educational" replace />
            </RouteGuard>
          }
        />
        <Route
          path="/configuration/educational"
          element={
            <RouteGuard>
              <EducationalConfiguration />
            </RouteGuard>
          }
        />
        <Route
          path="/configuration/other"
          element={
            <RouteGuard>
              <OtherConfiguration />
            </RouteGuard>
          }
        />
        <Route
          path="/incident-configuration"
          element={
            <RouteGuard>
              <IncidentConfiguration />
            </RouteGuard>
          }
        />
        <Route
          path="/employees"
          element={
            <RouteGuard>
              <EmployeeManagement />
            </RouteGuard>
          }
        />
        <Route
          path="/students"
          element={
            <RouteGuard>
              <StudentManagement />
            </RouteGuard>
          }
        />
        <Route
          path="/facilities"
          element={
            <RouteGuard>
              <FacilityManagement />
            </RouteGuard>
          }
        />
        <Route
          path="/users"
          element={
            <RouteGuard>
              <UserManagement />
            </RouteGuard>
          }
        />
        <Route
          path="/clients"
          element={
            <RouteGuard>
              <ClientManagement />
            </RouteGuard>
          }
        />

        {/* Assessment Module Routes - fix the assessmentRoutes usage */}
        {assessmentRoutes.default}

        {/* Backoffice Routes */}
        <Route
          path="/backoffice"
          element={
            <RouteGuard>
              <BackofficeDashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/backoffice/analytics"
          element={
            <RouteGuard>
              <BackofficeAnalytics />
            </RouteGuard>
          }
        />
        <Route
          path="/backoffice/settings"
          element={
            <RouteGuard>
              <BackofficeSettings />
            </RouteGuard>
          }
        />
        <Route
          path="/backoffice/assessment-templates"
          element={
            <RouteGuard>
              <AssessmentTemplatesManagementPage />
            </RouteGuard>
          }
        />
        <Route
          path="/backoffice/edusafe-resources"
          element={
            <RouteGuard>
              <EduSafeResourcesManagementPage />
            </RouteGuard>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;

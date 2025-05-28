import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import IncidentsPage from '@/pages/IncidentsPage';
import IncidentDetailPage from '@/pages/IncidentDetailPage';
import ReportIncidentPage from '@/pages/ReportIncidentPage';
import EditIncidentPage from '@/pages/EditIncidentPage';
import InsightsPage from '@/pages/InsightsPage';
import AssessmentsPage from '@/pages/AssessmentsPage';
import AnswerAssessmentPage from '@/pages/AnswerAssessmentPage';
import AssessmentResponseFormPage from '@/pages/AssessmentResponseFormPage';
import AnswerAssessmentNewPage from '@/pages/AnswerAssessmentNewPage';
import EmployeeVerificationPage from '@/pages/EmployeeVerificationPage';
import GrievancesPage from '@/pages/GrievancesPage';
import TransportSafetyPage from '@/pages/TransportSafetyPage';
import EduSafeResourcesPage from '@/pages/EduSafeResourcesPage';
import UsersPage from '@/pages/UsersPage';
import ConfigurationPage from '@/pages/ConfigurationPage';
import FormsPage from '@/pages/FormsPage';
import { EmployeeDataProvider } from '@/components/employee/EmployeeDataProvider';

// Backoffice Pages
import BackofficeDashboard from '@/pages/backoffice/BackofficeDashboard';
import ClientsPage from '@/pages/backoffice/ClientsPage';
import ModulesPage from '@/pages/backoffice/ModulesPage';
import AssessmentTemplatesPage from '@/pages/backoffice/AssessmentTemplatesPage';
import BackofficeEduSafeResourcesPage from '@/pages/backoffice/EduSafeResourcesPage';
import AnalyticsPage from '@/pages/backoffice/AnalyticsPage';
import BackofficeSettingsPage from '@/pages/backoffice/SettingsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmployeeDataProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />

              {/* Client Routes */}
              <Route path="/dashboard" element={
                <RouteGuard requiresAuth={true}>
                  <DashboardPage />
                </RouteGuard>
              } />
              <Route path="/incidents" element={
                <RouteGuard requiresAuth={true}>
                  <IncidentsPage />
                </RouteGuard>
              } />
              <Route path="/incidents/:id" element={
                <RouteGuard requiresAuth={true}>
                  <IncidentDetailPage />
                </RouteGuard>
              } />
              <Route path="/report" element={
                <RouteGuard requiresAuth={true}>
                  <ReportIncidentPage />
                </RouteGuard>
              } />
              <Route path="/incidents/:id/edit" element={
                <RouteGuard requiresAuth={true}>
                  <EditIncidentPage />
                </RouteGuard>
              } />
              <Route path="/insights" element={
                <RouteGuard requiresAuth={true}>
                  <InsightsPage />
                </RouteGuard>
              } />
              <Route path="/assessments" element={
                <RouteGuard requiresAuth={true}>
                  <AssessmentsPage />
                </RouteGuard>
              } />
              <Route path="/assessments/:id/answer" element={
                <RouteGuard requiresAuth={true}>
                  <AnswerAssessmentPage />
                </RouteGuard>
              } />
              <Route path="/assessments/:id/answer/form" element={
                <RouteGuard requiresAuth={true}>
                  <AssessmentResponseFormPage />
                </RouteGuard>
              } />
              <Route path="/assessments/answer/new" element={
                <RouteGuard requiresAuth={true}>
                  <AnswerAssessmentNewPage />
                </RouteGuard>
              } />
              <Route path="/employee-verification" element={
                <RouteGuard requiresAuth={true}>
                  <EmployeeVerificationPage />
                </RouteGuard>
              } />
              <Route path="/grievances" element={
                <RouteGuard requiresAuth={true}>
                  <GrievancesPage />
                </RouteGuard>
              } />
              <Route path="/transport-safety" element={
                <RouteGuard requiresAuth={true}>
                  <TransportSafetyPage />
                </RouteGuard>
              } />
              <Route path="/edusafe-resources" element={
                <RouteGuard requiresAuth={true}>
                  <EduSafeResourcesPage />
                </RouteGuard>
              } />
              <Route path="/users" element={
                <RouteGuard requiresAuth={true}>
                  <UsersPage />
                </RouteGuard>
              } />
              <Route path="/configuration" element={
                <RouteGuard requiresAuth={true}>
                  <ConfigurationPage />
                </RouteGuard>
              } />
              <Route path="/forms" element={
                <RouteGuard requiresAuth={true}>
                  <FormsPage />
                </RouteGuard>
              } />

              {/* Backoffice Routes */}
              <Route path="/backoffice/*" element={
                <RouteGuard requiresAuth={true}>
                  <Routes>
                    <Route index element={<Navigate to="/backoffice/dashboard" replace />} />
                    <Route path="dashboard" element={<BackofficeDashboard />} />
                    <Route path="clients" element={<ClientsPage />} />
                    <Route path="modules" element={<ModulesPage />} />
                    <Route path="assessments/templates" element={<AssessmentTemplatesPage />} />
                    <Route path="edusafe-resources" element={<BackofficeEduSafeResourcesPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<BackofficeSettingsPage />} />
                  </Routes>
                </RouteGuard>
              } />

              {/* Public Routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </EmployeeDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

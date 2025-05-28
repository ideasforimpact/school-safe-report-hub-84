
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
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />

            {/* Client Routes */}
            <Route path="/dashboard" element={
              <RouteGuard>
                <DashboardPage />
              </RouteGuard>
            } />
            <Route path="/incidents" element={
              <RouteGuard>
                <IncidentsPage />
              </RouteGuard>
            } />
            <Route path="/incidents/:id" element={
              <RouteGuard>
                <IncidentDetailPage />
              </RouteGuard>
            } />
            <Route path="/report" element={
              <RouteGuard>
                <ReportIncidentPage />
              </RouteGuard>
            } />
            <Route path="/incidents/:id/edit" element={
              <RouteGuard>
                <EditIncidentPage />
              </RouteGuard>
            } />
            <Route path="/insights" element={
              <RouteGuard>
                <InsightsPage />
              </RouteGuard>
            } />
            <Route path="/assessments" element={
              <RouteGuard>
                <AssessmentsPage />
              </RouteGuard>
            } />
            <Route path="/assessments/:id/answer" element={
              <RouteGuard>
                <AnswerAssessmentPage />
              </RouteGuard>
            } />
            <Route path="/assessments/:id/answer/form" element={
              <RouteGuard>
                <AssessmentResponseFormPage />
              </RouteGuard>
            } />
            <Route path="/assessments/answer/new" element={
              <RouteGuard>
                <AnswerAssessmentNewPage />
              </RouteGuard>
            } />
            <Route path="/employee-verification" element={
              <RouteGuard>
                <EmployeeVerificationPage />
              </RouteGuard>
            } />
            <Route path="/grievances" element={
              <RouteGuard>
                <GrievancesPage />
              </RouteGuard>
            } />
            <Route path="/transport-safety" element={
              <RouteGuard>
                <TransportSafetyPage />
              </RouteGuard>
            } />
            <Route path="/edusafe-resources" element={
              <RouteGuard>
                <EduSafeResourcesPage />
              </RouteGuard>
            } />
            <Route path="/users" element={
              <RouteGuard>
                <UsersPage />
              </RouteGuard>
            } />
            <Route path="/configuration" element={
              <RouteGuard>
                <ConfigurationPage />
              </RouteGuard>
            } />
            <Route path="/forms" element={
              <RouteGuard>
                <FormsPage />
              </RouteGuard>
            } />

            {/* Backoffice Routes */}
            <Route path="/backoffice/*" element={
              <RouteGuard>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

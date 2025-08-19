import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import ModuleGuard from './components/ModuleGuard';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import EditIncident from './pages/EditIncident';
import Insights from './pages/Insights';
import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import FacilityManagement from './pages/FacilityManagement';
import ConfigurationManagement from './pages/ConfigurationManagement';
import EducationalConfiguration from './pages/EducationalConfiguration';
import IncidentConfiguration from './pages/IncidentConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';
import SettingsPage from './pages/SettingsPage';
import FormsPage from './pages/FormsPage';
import FormPreviewPage from './pages/FormPreviewPage';
import PublicFormSubmissionPage from './pages/PublicFormSubmissionPage';
import PublicFormSubmissionSuccessPage from './pages/PublicFormSubmissionSuccessPage';
import CaptchaVerificationPage from './pages/CaptchaVerificationPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import Benchmarking from './pages/Benchmarking';
import Support from './pages/Support';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import NewsPage from './pages/NewsPage';

// Assessment pages
import AssessmentsPage from './pages/AssessmentsPage';
import AssessmentResponsePage from './pages/AssessmentResponsePage';
import AnswerAssessmentPage from './pages/AnswerAssessmentPage';
import AssessmentAnswerPage from './pages/AssessmentAnswerPage';

// Backoffice pages
import BackofficeLogin from './pages/BackofficeLogin';
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import ClientManagement from './pages/ClientManagement';
import ModulesPage from './pages/backoffice/ModulesPage';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import AssessmentTemplatesManagementPage from './pages/backoffice/AssessmentTemplatesManagementPage';
import BackofficeEduSafeResourcesPage from './pages/backoffice/BackofficeEduSafeResourcesPage';

// EduSafe pages
import EduSafeResourcesPage from './pages/edusafe/EduSafeResourcesPage';
import UploadResourcePage from './pages/edusafe/UploadResourcePage';
import EditResourcePage from './pages/edusafe/EditResourcePage';

// Employee Verification pages
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from './pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from './pages/employee-verification/UploadDocumentPage';
import VerificationDashboardPage from './pages/employee-verification/VerificationDashboardPage';

// Transport Safety pages
import TransportSafetyPage from './pages/transport-safety/TransportSafetyPage';
import VehicleDetailPage from './pages/transport-safety/VehicleDetailPage';
import DocumentsPage from './pages/transport-safety/DocumentsPage';

// Feedback pages
import FeedbackPage from './pages/feedback/FeedbackPage';
import FormResponsePage from './pages/feedback/FormResponsePage';

// Grievances pages
import GrievancesPage from './pages/grievances/GrievancesPage';
import GrievancesDashboardPage from './pages/grievances/GrievancesDashboardPage';
import GrievanceSubmitPage from './pages/grievances/GrievanceSubmitPage';
import PublicGrievanceForm from './pages/grievances/PublicGrievanceForm';
import ThankYouPage from './pages/grievances/ThankYouPage';

// Import the new backoffice employee verification pages
import BackofficeEmployeeVerificationPage from './pages/backoffice/BackofficeEmployeeVerificationPage';
import BackofficeEmployeeDocumentsPage from './pages/backoffice/BackofficeEmployeeDocumentsPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/support" element={<Support />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/news" element={<NewsPage />} />
      
      {/* Public form routes */}
      <Route path="/public-form/:formId" element={<PublicFormSubmissionPage />} />
      <Route path="/public-form-submission-success" element={<PublicFormSubmissionSuccessPage />} />
      <Route path="/captcha-verification" element={<CaptchaVerificationPage />} />
      <Route path="/captcha-verification/:formId" element={<CaptchaVerificationPage />} />
      
      {/* Public grievance routes */}
      <Route path="/public-grievance-form" element={<PublicGrievanceForm />} />
      <Route path="/grievance-thank-you" element={<ThankYouPage />} />
      
      {/* Backoffice routes */}
      <Route path="/backoffice/login" element={<BackofficeLogin />} />
      <Route path="/backoffice" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeDashboard />
        </RouteGuard>
      } />
      <Route path="/backoffice/clients" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <ClientManagement />
        </RouteGuard>
      } />
      <Route path="/backoffice/modules" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <ModulesPage />
        </RouteGuard>
      } />
      <Route path="/backoffice/employee-verification" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeEmployeeVerificationPage />
        </RouteGuard>
      } />
      <Route path="/backoffice/employee-verification/employee/:employeeId" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeEmployeeDocumentsPage />
        </RouteGuard>
      } />
      <Route path="/backoffice/settings" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeSettings />
        </RouteGuard>
      } />
      <Route path="/backoffice/analytics" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeAnalytics />
        </RouteGuard>
      } />
      <Route path="/backoffice/assessment-templates" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <AssessmentTemplatesManagementPage />
        </RouteGuard>
      } />
      <Route path="/backoffice/edusafe-resources" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <BackofficeEduSafeResourcesPage />
        </RouteGuard>
      } />

      {/* Backoffice Forms */}
      <Route path="/backoffice/forms" element={
        <RouteGuard requireAuth={true} isBackoffice={true}>
          <FormsPage />
        </RouteGuard>
      } />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <RouteGuard requireAuth={true}>
          <Dashboard />
        </RouteGuard>
      } />
      
      <Route path="/profile" element={
        <RouteGuard requireAuth={true}>
          <ProfilePage />
        </RouteGuard>
      } />

      {/* Incident Management - Updated to use IncidentsList */}
      <Route path="/report-incident" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['incident_management']}>
            <ReportIncident />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/incidents" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['incident_management']}>
            <IncidentsList />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/incident/:incidentId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['incident_management']}>
            <IncidentDetail />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/edit-incident/:incidentId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['incident_management']}>
            <EditIncident />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Insights */}
      <Route path="/insights" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['incident_management']}>
            <Insights />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Benchmarking */}
      <Route path="/benchmarking" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['benchmarking']}>
            <Benchmarking />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* User Management */}
      <Route path="/users" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['user_management']}>
            <UserManagement />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Student Management */}
      <Route path="/students" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['student_management']}>
            <StudentManagement />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Employee Management */}
      <Route path="/employees" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['employee_management']}>
            <EmployeeManagement />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Facility Management */}
      <Route path="/facilities" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['facility_management']}>
            <FacilityManagement />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Configuration */}
      <Route path="/configuration" element={
        <RouteGuard requireAuth={true}>
          <ConfigurationManagement />
        </RouteGuard>
      } />
      <Route path="/configuration/educational" element={
        <RouteGuard requireAuth={true}>
          <EducationalConfiguration />
        </RouteGuard>
      } />
      <Route path="/configuration/incident" element={
        <RouteGuard requireAuth={true}>
          <IncidentConfiguration />
        </RouteGuard>
      } />
      <Route path="/configuration/other" element={
        <RouteGuard requireAuth={true}>
          <OtherConfiguration />
        </RouteGuard>
      } />

      {/* Settings and Forms */}
      <Route path="/settings" element={
        <RouteGuard requireAuth={true}>
          <SettingsPage />
        </RouteGuard>
      } />
      <Route path="/forms" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['feedback_forms']}>
            <FormsPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/forms/preview/:formId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['feedback_forms']}>
            <FormPreviewPage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Assessments */}
      <Route path="/assessments/*" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['assessments']}>
            <Routes>
              <Route index element={<AssessmentsPage />} />
              <Route path="response/:assignmentId" element={<AssessmentResponsePage />} />
              <Route path="answer/:assignmentId" element={<AnswerAssessmentPage />} />
              <Route path="answer-new/:assignmentId" element={<AssessmentAnswerPage />} />
            </Routes>
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* EduSafe */}
      <Route path="/edusafe" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['edusafe']}>
            <EduSafeResourcesPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/edusafe/upload" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['edusafe']}>
            <UploadResourcePage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/edusafe/edit/:resourceId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['edusafe']}>
            <EditResourcePage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Employee Verification */}
      <Route path="/employee-verification" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['employee_verification']}>
            <EmployeeVerificationPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/employee-verification/dashboard" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['employee_verification']}>
            <VerificationDashboardPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/employee-verification/employee/:employeeId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['employee_verification']}>
            <EmployeeDetailPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/employee-verification/upload/:employeeId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['employee_verification']}>
            <UploadDocumentPage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Transport Safety */}
      <Route path="/transport-safety" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['transport_safety']}>
            <TransportSafetyPage />
          </ModuleGuard>
        </RouteGuard>
      } />

      <Route path="/transport-safety/vehicle/:vehicleId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['transport_safety']}>
            <VehicleDetailPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/transport-safety/documents" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['transport_safety']}>
            <DocumentsPage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Feedback */}
      <Route path="/feedback" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['feedback_forms']}>
            <FeedbackPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/feedback/response/:responseId" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['feedback_forms']}>
            <FormResponsePage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* Grievances */}
      <Route path="/grievances" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['grievance_management']}>
            <GrievancesPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/grievances/dashboard" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['grievance_management']}>
            <GrievancesDashboardPage />
          </ModuleGuard>
        </RouteGuard>
      } />
      <Route path="/grievances/submit" element={
        <RouteGuard requireAuth={true}>
          <ModuleGuard requiredModules={['grievance_management']}>
            <GrievanceSubmitPage />
          </ModuleGuard>
        </RouteGuard>
      } />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth';
import { ClientProvider } from '@/contexts/ClientContext';
import { StudentProvider } from './contexts/StudentContext';
import { IncidentProvider } from './contexts/incident';
import { EmployeeVerificationProvider } from './contexts/employee-verification';
import { FacilityProvider } from './contexts/FacilityContext';
import { AssessmentProvider } from '@/contexts/assessment/AssessmentContext';
import { EmployeeProvider as EmployeeContextProvider } from './contexts/employee/EmployeeContext';
import RouteGuard from '@/components/RouteGuard';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import UserManagement from '@/pages/UserManagement';
import ClientManagement from '@/pages/ClientManagement';
import EmployeeManagement from '@/pages/EmployeeManagement';
import StudentManagement from '@/pages/StudentManagement';
import EducationalConfiguration from '@/pages/EducationalConfiguration';
import OtherConfiguration from '@/pages/OtherConfiguration';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import TransportSafetyPage from '@/pages/transport-safety/TransportSafetyPage';
import VehicleDetailPage from '@/pages/transport-safety/VehicleDetailPage';
import DocumentsPage from '@/pages/transport-safety/DocumentsPage';
import IncidentsList from '@/pages/IncidentsList';
import IncidentDetail from '@/pages/IncidentDetail';
import ReportIncident from '@/pages/ReportIncident';
import EditIncidentPage from '@/pages/EditIncidentPage';
import Insights from '@/pages/Insights';
import FacilityManagement from '@/pages/FacilityManagement';
import AssessmentsPage from '@/pages/AssessmentsPage';
import AssessmentResponsePage from '@/pages/AssessmentResponsePage';
import AnswerAssessmentPage from '@/pages/AnswerAssessmentPage';
import AssessmentAnswerPage from '@/pages/AssessmentAnswerPage';
import IncidentConfiguration from '@/pages/IncidentConfiguration';
import ProfilePage from '@/pages/ProfilePage';
import FormPreviewPage from '@/pages/FormPreviewPage';
import FormsPage from '@/pages/FormsPage';
import PublicFormSubmissionPage from '@/pages/PublicFormSubmissionPage';
import PublicFormSubmissionSuccessPage from '@/pages/PublicFormSubmissionSuccessPage';
import CaptchaVerificationPage from '@/pages/CaptchaVerificationPage';

// Employee Verification Pages
import EmployeeVerificationPage from '@/pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from '@/pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from '@/pages/employee-verification/UploadDocumentPage';
import VerificationDashboardPage from '@/pages/employee-verification/VerificationDashboardPage';
import BackofficeLogin from '@/pages/BackofficeLogin';
import SettingsPage from '@/pages/SettingsPage';

// EduSafe Pages
import EduSafeResourcesPage from '@/pages/edusafe/EduSafeResourcesPage';
import UploadResourcePage from '@/pages/edusafe/UploadResourcePage';
import EditResourcePage from '@/pages/edusafe/EditResourcePage';

// Feedback Pages
import FeedbackPage from '@/pages/feedback/FeedbackPage';
import FormResponsePage from '@/pages/feedback/FormResponsePage';

// Grievances Pages
import GrievancesPage from '@/pages/grievances/GrievancesPage';
import GrievancesDashboardPage from '@/pages/grievances/GrievancesDashboardPage';
import GrievanceSubmitPage from '@/pages/grievances/GrievanceSubmitPage';
import PublicGrievanceForm from '@/pages/grievances/PublicGrievanceForm';
import ThankYouPage from '@/pages/grievances/ThankYouPage';

// Backoffice Pages
import ModulesPage from '@/pages/backoffice/ModulesPage';
import BackofficeEduSafeResourcesPage from '@/pages/backoffice/BackofficeEduSafeResourcesPage';
import BackofficeEmployeeVerificationPage from '@/pages/backoffice/BackofficeEmployeeVerificationPage';
import BackofficeEmployeeDocumentsPage from '@/pages/backoffice/BackofficeEmployeeDocumentsPage';

// Layout for Backoffice
import BackofficeLayout from '@/components/layout/BackofficeLayout';

// Backoffice Wrapper Component for routing
const BackofficeWrapper = ({ component: Component }) => {
  return (
    <BackofficeLayout>
      <Component />
    </BackofficeLayout>
  );
};

function App() {
  return (
    <ClientProvider>
      <EmployeeContextProvider>
        <IncidentProvider>
          <StudentProvider>
            <FacilityProvider>
              <EmployeeVerificationProvider>
                <AssessmentProvider>
                  <Routes>
                    {/* Public routes - no authentication required */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/backoffice/login" element={<BackofficeLogin />} />
                    
                    {/* CAPTCHA Verification routes - public */}
                    <Route path="/captcha-verification" element={<CaptchaVerificationPage />} />
                    <Route path="/captcha-verification/:formId" element={<CaptchaVerificationPage />} />
                    
                    {/* Public form routes */}
                    <Route path="/public-form/:formId" element={<PublicFormSubmissionPage />} />
                    <Route path="/public-form-submission-success" element={<PublicFormSubmissionSuccessPage />} />
                    
                    {/* Public grievance routes */}
                    <Route path="/public-grievance-form" element={<PublicGrievanceForm />} />
                    <Route path="/grievance-thank-you" element={<ThankYouPage />} />
                    
                    {/* Make Home page the default route */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Protected routes - require authentication */}
                    <Route path="/dashboard" element={<RouteGuard requireAuth={true}><Dashboard /></RouteGuard>} />
                    <Route path="/users" element={<RouteGuard requireAuth={true}><UserManagement /></RouteGuard>} />
                    <Route path="/clients" element={<RouteGuard requireAuth={true}><ClientManagement /></RouteGuard>} />
                    <Route path="/employees" element={<RouteGuard requireAuth={true}><EmployeeManagement /></RouteGuard>} />
                    <Route path="/students" element={<RouteGuard requireAuth={true}><StudentManagement /></RouteGuard>} />
                    <Route path="/educational-configuration" element={<RouteGuard requireAuth={true}><EducationalConfiguration /></RouteGuard>} />
                    <Route path="/other-configuration" element={<RouteGuard requireAuth={true}><OtherConfiguration /></RouteGuard>} />
                    <Route path="/facilities-configuration" element={<RouteGuard requireAuth={true}><FacilityManagement /></RouteGuard>} />
                    <Route path="/facility-management" element={<RouteGuard requireAuth={true}><FacilityManagement /></RouteGuard>} />
                    <Route path="/incident-configuration" element={<RouteGuard requireAuth={true}><IncidentConfiguration /></RouteGuard>} />
                    
                    {/* Settings route */}
                    <Route path="/settings" element={<RouteGuard requireAuth={true}><SettingsPage /></RouteGuard>} />
                    
                    {/* Profile route */}
                    <Route path="/profile" element={<RouteGuard requireAuth={true}><ProfilePage /></RouteGuard>} />

                    {/* Form routes */}
                    <Route path="/forms" element={<RouteGuard requireAuth={true}><FormsPage /></RouteGuard>} />
                    <Route path="/form-preview/:formId" element={<RouteGuard requireAuth={true}><FormPreviewPage /></RouteGuard>} />

                    {/* Incident routes */}
                    <Route path="/incidents" element={<RouteGuard requireAuth={true}><IncidentsList /></RouteGuard>} />
                    <Route path="/incidents/:id" element={<RouteGuard requireAuth={true}><IncidentDetail /></RouteGuard>} />
                    <Route path="/incident/:id" element={<RouteGuard requireAuth={true}><IncidentDetail /></RouteGuard>} />
                    <Route path="/report-incident" element={<RouteGuard requireAuth={true}><ReportIncident /></RouteGuard>} />
                    <Route path="/incident/:id/edit" element={<RouteGuard requireAuth={true}><EditIncidentPage /></RouteGuard>} />
                    <Route path="/edit-incident/:id" element={<RouteGuard requireAuth={true}><EditIncidentPage /></RouteGuard>} />
                    <Route path="/insights" element={<RouteGuard requireAuth={true}><Insights /></RouteGuard>} />

                    {/* Assessment routes */}
                    <Route path="/assessments" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates/:templateId" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates/new" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates/:templateId/edit" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates/:templateId/assign" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/templates/:templateId/bulk-assign" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/assignments" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessments/results" element={<RouteGuard requireAuth={true}><AssessmentsPage /></RouteGuard>} />
                    <Route path="/assessment/answer/:assessmentId" element={<RouteGuard requireAuth={true}><AssessmentAnswerPage /></RouteGuard>} />
                    <Route path="/assessments/answer/:assessmentId" element={<RouteGuard requireAuth={true}><AnswerAssessmentPage /></RouteGuard>} />
                    <Route path="/assessments/response/:assessmentId" element={<RouteGuard requireAuth={true}><AssessmentResponsePage /></RouteGuard>} />
                    <Route path="/assessments/respond/:assignmentId" element={<RouteGuard requireAuth={true}><AssessmentResponsePage /></RouteGuard>} />

                    {/* EduSafe routes */}
                    <Route path="/edusafe" element={<RouteGuard requireAuth={true}><EduSafeResourcesPage /></RouteGuard>} />
                    <Route path="/edusafe/upload" element={<RouteGuard requireAuth={true}><UploadResourcePage /></RouteGuard>} />
                    <Route path="/edusafe/edit/:resourceId" element={<RouteGuard requireAuth={true}><EditResourcePage /></RouteGuard>} />

                    {/* Feedback routes */}
                    <Route path="/feedback" element={<RouteGuard requireAuth={true}><FeedbackPage /></RouteGuard>} />
                    <Route path="/feedback/form/:formId" element={<RouteGuard requireAuth={true}><FormResponsePage /></RouteGuard>} />

                    {/* Grievances routes */}
                    <Route path="/grievances" element={<RouteGuard requireAuth={true}><GrievancesPage /></RouteGuard>} />
                    <Route path="/grievances/dashboard" element={<RouteGuard requireAuth={true}><GrievancesDashboardPage /></RouteGuard>} />
                    <Route path="/grievances/submit" element={<RouteGuard requireAuth={true}><GrievanceSubmitPage /></RouteGuard>} />
                    <Route path="/grievances/submit-public" element={<PublicGrievanceForm />} />
                    <Route path="/grievances/thank-you" element={<ThankYouPage />} />

                    {/* Transport Safety routes */}
                    <Route path="/transport-safety" element={<RouteGuard requireAuth={true}><TransportSafetyPage /></RouteGuard>} />
                    <Route path="/transport-safety/documents" element={<RouteGuard requireAuth={true}><DocumentsPage /></RouteGuard>} />
                    <Route path="/transport-safety/:vehicleId" element={<RouteGuard requireAuth={true}><VehicleDetailPage /></RouteGuard>} />
                    <Route path="/transport-safety/:vehicleId/documents" element={<RouteGuard requireAuth={true}><DocumentsPage /></RouteGuard>} />
                    
                    {/* Employee Verification routes */}
                    <Route path="/employee-verification" element={<RouteGuard requireAuth={true}><EmployeeVerificationPage /></RouteGuard>} />
                    <Route path="/employee-verification/:employeeId" element={<RouteGuard requireAuth={true}><EmployeeDetailPage /></RouteGuard>} />
                    <Route path="/employee-verification/:employeeId/upload-document" element={<RouteGuard requireAuth={true}><UploadDocumentPage /></RouteGuard>} />
                    <Route path="/employee-verification/dashboard" element={<RouteGuard requireAuth={true}><VerificationDashboardPage /></RouteGuard>} />

                    {/* Backoffice routes */}
                    <Route path="/backoffice/dashboard" element={<BackofficeWrapper component={Dashboard} />} />
                    <Route path="/backoffice/clients" element={<BackofficeWrapper component={ClientManagement} />} />
                    <Route path="/backoffice/settings" element={<BackofficeWrapper component={SettingsPage} />} />
                    <Route path="/backoffice/modules" element={<ModulesPage />} />
                    <Route path="/backoffice/profile" element={<BackofficeWrapper component={ProfilePage} />} />
                    <Route path="/backoffice/assessments" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/new" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/edit" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/assign" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/bulk-assign" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/assignments" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/results" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessment/answer/:assessmentId" element={<BackofficeWrapper component={AssessmentAnswerPage} />} />
                    <Route path="/backoffice/assessments/answer/:assessmentId" element={<BackofficeWrapper component={AnswerAssessmentPage} />} />
                    <Route path="/backoffice/assessments/response/:assessmentId" element={<BackofficeWrapper component={AssessmentResponsePage} />} />
                    <Route path="/backoffice/assessments/respond/:assignmentId" element={<BackofficeWrapper component={AssessmentResponsePage} />} />
                    <Route path="/backoffice/edusafe-resources" element={<BackofficeWrapper component={BackofficeEduSafeResourcesPage} />} />
                    
                    {/* Backoffice Employee Verification routes */}
                    <Route path="/backoffice-employee-verification" element={<BackofficeWrapper component={BackofficeEmployeeVerificationPage} />} />
                    <Route path="/backoffice-employee-verification/employee/:employeeId" element={<BackofficeWrapper component={BackofficeEmployeeDocumentsPage} />} />
                    
                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <Toaster position="top-right" closeButton={true} />
                </AssessmentProvider>
              </EmployeeVerificationProvider>
            </FacilityProvider>
          </StudentProvider>
        </IncidentProvider>
      </EmployeeContextProvider>
    </ClientProvider>
  );
}

export default App;

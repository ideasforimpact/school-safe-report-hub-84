
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
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/backoffice/login" element={<BackofficeLogin />} />
                    
                    {/* Make Home page the default route */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Routes that were previously protected - now public */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/clients" element={<ClientManagement />} />
                    <Route path="/employees" element={<EmployeeManagement />} />
                    <Route path="/students" element={<StudentManagement />} />
                    <Route path="/educational-configuration" element={<EducationalConfiguration />} />
                    <Route path="/other-configuration" element={<OtherConfiguration />} />
                    <Route path="/facilities-configuration" element={<FacilityManagement />} />
                    <Route path="/facility-management" element={<FacilityManagement />} />
                    <Route path="/incident-configuration" element={<IncidentConfiguration />} />
                    
                    {/* New Settings route */}
                    <Route path="/settings" element={<SettingsPage />} />
                    
                    {/* Profile route */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Form routes */}
                    <Route path="/forms" element={<FormsPage />} />
                    <Route path="/form-preview/:formId" element={<FormPreviewPage />} />
                    <Route path="/public-form/:formId" element={<PublicFormSubmissionPage />} />
                    <Route path="/public-form-submission-success" element={<PublicFormSubmissionSuccessPage />} />

                    {/* Incident routes - Make sure both patterns work */}
                    <Route path="/incidents" element={<IncidentsList />} />
                    <Route path="/incidents/:id" element={<IncidentDetail />} />
                    <Route path="/incident/:id" element={<IncidentDetail />} />
                    <Route path="/report-incident" element={<ReportIncident />} />
                    {/* Use ReportIncident component for editing - it will detect edit mode from URL params */}
                    <Route path="/incident/:id/edit" element={<ReportIncident />} />
                    <Route path="/edit-incident/:id" element={<ReportIncident />} />
                    <Route path="/insights" element={<Insights />} />

                    {/* Assessment routes */}
                    <Route path="/assessments" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates/:templateId" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates/new" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates/:templateId/edit" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates/:templateId/assign" element={<AssessmentsPage />} />
                    <Route path="/assessments/templates/:templateId/bulk-assign" element={<AssessmentsPage />} />
                    <Route path="/assessments/assignments" element={<AssessmentsPage />} />
                    <Route path="/assessments/results" element={<AssessmentsPage />} />
                    {/* New route for answering assessments with new design */}
                    <Route path="/assessment/answer/:assessmentId" element={<AssessmentAnswerPage />} />
                    {/* Keep existing routes for backward compatibility */}
                    <Route path="/assessments/answer/:assessmentId" element={<AnswerAssessmentPage />} />
                    <Route path="/assessments/response/:assessmentId" element={<AssessmentResponsePage />} />
                    <Route path="/assessments/respond/:assignmentId" element={<AssessmentResponsePage />} />

                    {/* EduSafe routes */}
                    <Route path="/edusafe" element={<EduSafeResourcesPage />} />
                    <Route path="/edusafe/upload" element={<UploadResourcePage />} />
                    <Route path="/edusafe/edit/:resourceId" element={<EditResourcePage />} />

                    {/* Feedback routes */}
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/feedback/form/:formId" element={<FormResponsePage />} />

                    {/* Grievances routes */}
                    <Route path="/grievances" element={<GrievancesPage />} />
                    <Route path="/grievances/dashboard" element={<GrievancesDashboardPage />} />
                    <Route path="/grievances/submit" element={<GrievanceSubmitPage />} />
                    <Route path="/grievances/submit-public" element={<PublicGrievanceForm />} />
                    <Route path="/grievances/thank-you" element={<ThankYouPage />} />

                    {/* Transport Safety routes */}
                    <Route path="/transport-safety" element={<TransportSafetyPage />} />
                    <Route path="/transport-safety/documents" element={<DocumentsPage />} />
                    <Route path="/transport-safety/:vehicleId" element={<VehicleDetailPage />} />
                    <Route path="/transport-safety/:vehicleId/documents" element={<DocumentsPage />} />
                    
                    {/* Employee Verification routes */}
                    <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
                    <Route path="/employee-verification/:employeeId" element={<EmployeeDetailPage />} />
                    <Route path="/employee-verification/:employeeId/upload-document" element={<UploadDocumentPage />} />
                    <Route path="/employee-verification/dashboard" element={<VerificationDashboardPage />} />

                    {/* Backoffice routes - updated modules route to use standard Layout */}
                    <Route path="/backoffice/dashboard" element={<BackofficeWrapper component={Dashboard} />} />
                    <Route path="/backoffice/clients" element={<BackofficeWrapper component={ClientManagement} />} />
                    <Route path="/backoffice/settings" element={<BackofficeWrapper component={SettingsPage} />} />
                    <Route path="/backoffice/modules" element={<ModulesPage />} />
                    
                    {/* Backoffice Profile route */}
                    <Route path="/backoffice/profile" element={<BackofficeWrapper component={ProfilePage} />} />
                    
                    {/* Backoffice Assessment routes */}
                    <Route path="/backoffice/assessments" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/new" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/edit" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/assign" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/templates/:templateId/bulk-assign" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/assignments" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    <Route path="/backoffice/assessments/results" element={<BackofficeWrapper component={AssessmentsPage} />} />
                    {/* New backoffice assessment answer route */}
                    <Route path="/backoffice/assessment/answer/:assessmentId" element={<BackofficeWrapper component={AssessmentAnswerPage} />} />
                    {/* Existing backoffice assessment response routes */}
                    <Route path="/backoffice/assessments/answer/:assessmentId" element={<BackofficeWrapper component={AnswerAssessmentPage} />} />
                    <Route path="/backoffice/assessments/response/:assessmentId" element={<BackofficeWrapper component={AssessmentResponsePage} />} />
                    <Route path="/backoffice/assessments/respond/:assignmentId" element={<BackofficeWrapper component={AssessmentResponsePage} />} />

                    {/* Backoffice EduSafe Resources route - Fixed path */}
                    <Route path="/backoffice/edusafe-resources" element={<BackofficeWrapper component={BackofficeEduSafeResourcesPage} />} />
                    
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

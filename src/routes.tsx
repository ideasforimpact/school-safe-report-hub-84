
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ReportIncident from '@/pages/ReportIncident';
import IncidentsList from '@/pages/IncidentsList';
import IncidentDetail from '@/pages/IncidentDetail';
import Insights from '@/pages/Insights';
import SettingsPage from '@/pages/SettingsPage';
import UserManagement from '@/pages/UserManagement';
import StudentManagement from '@/pages/StudentManagement';
import EditIncident from '@/pages/EditIncident';
import NotFound from '@/pages/NotFound';
import EmployeeManagement from '@/pages/EmployeeManagement';
import ConfigurationManagement from '@/pages/ConfigurationManagement';
import EducationalConfiguration from '@/pages/EducationalConfiguration';
import OtherConfiguration from '@/pages/OtherConfiguration';
import IncidentConfiguration from '@/pages/IncidentConfiguration';
import FacilityManagement from '@/pages/FacilityManagement';
import AssessmentsPage from '@/pages/AssessmentsPage';
import BackofficeLogin from '@/pages/BackofficeLogin';
import AssessmentResponsePage from '@/pages/AssessmentResponsePage';
import AnswerAssessmentPage from '@/pages/AnswerAssessmentPage';
import AssessmentAnswerPage from '@/pages/AssessmentAnswerPage';
import EduSafeResourcesPage from '@/pages/edusafe/EduSafeResourcesPage';
import UploadResourcePage from '@/pages/edusafe/UploadResourcePage';
import EditResourcePage from '@/pages/edusafe/EditResourcePage';
import EmployeeVerificationPage from '@/pages/employee-verification/EmployeeVerificationPage';
import VerificationDashboardPage from '@/pages/employee-verification/VerificationDashboardPage';
import EmployeeDetailPage from '@/pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from '@/pages/employee-verification/UploadDocumentPage';
import FeedbackPage from '@/pages/feedback/FeedbackPage';
import FormResponsePage from '@/pages/feedback/FormResponsePage';
import GrievancesPage from '@/pages/grievances/GrievancesPage';
import GrievancesDashboardPage from '@/pages/grievances/GrievancesDashboardPage';
import GrievanceSubmitPage from '@/pages/grievances/GrievanceSubmitPage';
import PublicGrievanceForm from '@/pages/grievances/PublicGrievanceForm';
import ThankYouPage from '@/pages/grievances/ThankYouPage';
import TransportSafetyPage from '@/pages/transport-safety/TransportSafetyPage';
import DashboardPage from '@/pages/transport-safety/DashboardPage';
import VehicleDetailPage from '@/pages/transport-safety/VehicleDetailPage';
import DocumentsPage from '@/pages/transport-safety/DocumentsPage';
import Benchmarking from '@/pages/Benchmarking';
import ClientManagement from '@/pages/ClientManagement';
import BackofficeDashboard from '@/pages/backoffice/BackofficeDashboard';
import BackofficeAnalytics from '@/pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from '@/pages/backoffice/BackofficeSettings';
import AssessmentTemplatesManagementPage from '@/pages/backoffice/AssessmentTemplatesManagementPage';
import EduSafeResourcesManagementPage from '@/pages/backoffice/EduSafeResourcesManagementPage';
import Pricing from '@/pages/Pricing';
import Support from '@/pages/Support';
import Blog from '@/pages/Blog';
import NewsPage from '@/pages/NewsPage';
import ProfilePage from '@/pages/ProfilePage';
import FormPreviewPage from '@/pages/FormPreviewPage';
import FormsPage from '@/pages/FormsPage';
import PublicFormSubmissionPage from '@/pages/PublicFormSubmissionPage';
import PublicFormSubmissionSuccessPage from '@/pages/PublicFormSubmissionSuccessPage';
import BackofficeLayout from '@/components/layout/BackofficeLayout';

const BackofficeWrapper = ({ component: Component }) => {
  return (
    <BackofficeLayout>
      <Component />
    </BackofficeLayout>
  );
};

const routes = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/report-incident",
    element: <ReportIncident />,
  },
  {
    path: "/incidents",
    element: <IncidentsList />,
  },
  {
    path: "/incidents/:id",
    element: <IncidentDetail />,
  },
  {
    path: "/insights",
    element: <Insights />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "/users",
    element: <UserManagement />,
  },
  {
    path: "/students",
    element: <StudentManagement />,
  },
  {
    path: "/edit-incident/:id",
    element: <EditIncident />,
  },
  {
    path: "/employees",
    element: <EmployeeManagement />,
  },
  {
    path: "/configuration",
    element: <ConfigurationManagement />,
  },
  {
    path: "/educational-configuration",
    element: <EducationalConfiguration />,
  },
  {
    path: "/other-configuration",
    element: <OtherConfiguration />,
  },
  {
    path: "/incident-configuration",
    element: <IncidentConfiguration />,
  },
  {
    path: "/facilities",
    element: <FacilityManagement />,
  },
  {
    path: "/assessments",
    element: <AssessmentsPage />,
  },
  {
    path: "/backoffice/login",
    element: <BackofficeLogin />,
  },
  {
    path: "/assessment-response/:assignmentId",
    element: <AssessmentResponsePage />,
  },
  {
    path: "/answer-assessment/:assignmentId",
    element: <AnswerAssessmentPage />,
  },
  {
    path: "/assessment-answer/:assignmentId",
    element: <AssessmentAnswerPage />,
  },
  {
    path: "/edusafe",
    element: <EduSafeResourcesPage />,
  },
  {
    path: "/edusafe/upload",
    element: <UploadResourcePage />,
  },
  {
    path: "/edusafe/edit/:id",
    element: <EditResourcePage />,
  },
  {
    path: "/employee-verification",
    element: <EmployeeVerificationPage />,
  },
  {
    path: "/employee-verification/dashboard",
    element: <VerificationDashboardPage />,
  },
  {
    path: "/employee-verification/employee/:id",
    element: <EmployeeDetailPage />,
  },
  {
    path: "/employee-verification/upload/:employeeId",
    element: <UploadDocumentPage />,
  },
  {
    path: "/feedback",
    element: <FeedbackPage />,
  },
  {
    path: "/feedback/form/:formId",
    element: <FormResponsePage />,
  },
  {
    path: "/grievances",
    element: <GrievancesPage />,
  },
  {
    path: "/grievances/dashboard",
    element: <GrievancesDashboardPage />,
  },
  {
    path: "/grievances/submit",
    element: <GrievanceSubmitPage />,
  },
  {
    path: "/grievances/submit-public",
    element: <PublicGrievanceForm />,
  },
  {
    path: "/grievances/thank-you",
    element: <ThankYouPage />,
  },
  {
    path: "/transport-safety",
    element: <TransportSafetyPage />,
  },
  {
    path: "/transport-safety/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/transport-safety/vehicle/:id",
    element: <VehicleDetailPage />,
  },
  {
    path: "/transport-safety/documents",
    element: <DocumentsPage />,
  },
  {
    path: "/benchmarking",
    element: <Benchmarking />,
  },
  {
    path: "/clients",
    element: <ClientManagement />,
  },
  {
    path: "/backoffice",
    element: <BackofficeDashboard />,
  },
  {
    path: "/backoffice/analytics",
    element: <BackofficeAnalytics />,
  },
  {
    path: "/backoffice/settings",
    element: <BackofficeSettings />,
  },
  {
    path: "/backoffice/assessment-templates",
    element: <AssessmentTemplatesManagementPage />,
  },
  {
    path: "/backoffice/edusafe-resources",
    element: <BackofficeWrapper component={EduSafeResourcesManagementPage} />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/support",
    element: <Support />,
  },
  {
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/news",
    element: <NewsPage />,
  },
  {
    path: "/profile",
    element: <ProfilePage />,
  },
  {
    path: "/forms",
    element: <FormsPage />,
  },
  {
    path: "/form-preview/:formId",
    element: <FormPreviewPage />,
  },
  {
    path: "/public-form/:formId",
    element: <PublicFormSubmissionPage />,
  },
  {
    path: "/public-form-submission-success",
    element: <PublicFormSubmissionSuccessPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;

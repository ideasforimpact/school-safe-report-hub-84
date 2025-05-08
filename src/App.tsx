
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import IncidentDetail from './pages/IncidentDetail';
import IncidentsList from './pages/IncidentsList';
import Insights from './pages/Insights';
import EditIncident from './pages/EditIncident';
import NotFound from './pages/NotFound';
import ConfigurationManagement from './pages/configuration/ConfigurationManagement';
import { EducationalStructureConfig } from './pages/configuration/EducationalStructureConfig';
import { IncidentRelatedConfig } from './pages/configuration/IncidentRelatedConfig';
import { OtherSettingsConfig } from './pages/configuration/OtherSettingsConfig';
import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import FacilityManagement from './pages/FacilityManagement';
import Support from './pages/Support';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import ClientManagement from './pages/ClientManagement';
import AssessmentsPage from './pages/AssessmentsPage';
import Benchmarking from './pages/Benchmarking';
import NewsPage from './pages/NewsPage';

// Backoffice routes
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';

// Employee Verification routes
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from './pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from './pages/employee-verification/UploadDocumentPage';
import VerificationDashboardPage from './pages/employee-verification/VerificationDashboardPage';

// Feedback routes
import FeedbackPage from './pages/feedback/FeedbackPage';
import FormResponsePage from './pages/feedback/FormResponsePage';

// Grievances routes
import GrievancesPage from './pages/grievances/GrievancesPage';
import PublicGrievanceForm from './pages/grievances/PublicGrievanceForm';
import GrievancesDashboardPage from './pages/grievances/GrievancesDashboardPage';
import ThankYouPage from './pages/grievances/ThankYouPage';
import GrievanceSubmitPage from './pages/grievances/GrievanceSubmitPage';

// Transport Safety routes
import TransportSafetyPage from './pages/transport-safety/TransportSafetyPage';
import VehicleDetailPage from './pages/transport-safety/VehicleDetailPage';
import DocumentsPage from './pages/transport-safety/DocumentsPage';
import DashboardPage from './pages/transport-safety/DashboardPage';

// EduSafe Resources routes
import EduSafeResourcesPage from './pages/edusafe/EduSafeResourcesPage';
import UploadResourcePage from './pages/edusafe/UploadResourcePage';
import EditResourcePage from './pages/edusafe/EditResourcePage';

// Configuration pages
import EducationalConfiguration from './pages/EducationalConfiguration';
import IncidentConfiguration from './pages/IncidentConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';

import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/news" element={<NewsPage />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/report-incident" element={<ReportIncident />} />
      <Route path="/incidents" element={<IncidentsList />} />
      <Route path="/incident/:incidentId" element={<IncidentDetail />} />
      <Route path="/edit-incident/:incidentId" element={<EditIncident />} />
      <Route path="/insights" element={<Insights />} />
      
      {/* Configuration Routes */}
      <Route path="/configuration" element={<ConfigurationManagement />} />
      <Route path="/educational-configuration" element={<EducationalConfiguration />} />
      <Route path="/incident-configuration" element={<IncidentConfiguration />} />
      <Route path="/other-configuration" element={<OtherConfiguration />} />
      
      {/* Management Routes */}
      <Route path="/users" element={<UserManagement />} />
      <Route path="/students" element={<StudentManagement />} />
      <Route path="/facilities" element={<FacilityManagement />} />
      
      {/* Backoffice Routes */}
      <Route path="/backoffice" element={<BackofficeDashboard />} />
      <Route path="/backoffice/analytics" element={<BackofficeAnalytics />} />
      <Route path="/backoffice/settings" element={<BackofficeSettings />} />
      <Route path="/backoffice/clients" element={<ClientManagement />} />
      
      {/* Assessments Routes */}
      <Route path="/assessments/*" element={<AssessmentsPage />} />
      
      {/* Benchmarking Routes */}
      <Route path="/benchmarking" element={<Benchmarking />} />
      
      {/* Employee Verification Routes */}
      <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
      <Route path="/employee-verification/dashboard" element={<VerificationDashboardPage />} />
      <Route path="/employee-verification/employee/:employeeId" element={<EmployeeDetailPage />} />
      <Route path="/employee-verification/upload/:employeeId" element={<UploadDocumentPage />} />
      
      {/* Feedback Routes */}
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/feedback/response/:formId" element={<FormResponsePage />} />
      
      {/* Grievances Routes */}
      <Route path="/grievances" element={<GrievancesPage />} />
      <Route path="/grievances/form" element={<PublicGrievanceForm />} />
      <Route path="/grievances/submit" element={<GrievanceSubmitPage />} />
      <Route path="/grievances/dashboard" element={<GrievancesDashboardPage />} />
      <Route path="/grievances/thank-you" element={<ThankYouPage />} />
      
      {/* Transport Safety Routes */}
      <Route path="/transport-safety" element={<TransportSafetyPage />} />
      <Route path="/transport-safety/:vehicleId" element={<VehicleDetailPage />} />
      <Route path="/transport-safety/:vehicleId/documents" element={<DocumentsPage />} />
      <Route path="/transport-safety/dashboard" element={<DashboardPage />} />
      
      {/* EduSafe Resources Routes */}
      <Route path="/edusafe-resources" element={<EduSafeResourcesPage />} />
      <Route path="/edusafe-resources/upload" element={<UploadResourcePage />} />
      <Route path="/edusafe-resources/edit/:resourceId" element={<EditResourcePage />} />
      
      {/* Public Routes */}
      <Route path="/support" element={<Support />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/pricing" element={<Pricing />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

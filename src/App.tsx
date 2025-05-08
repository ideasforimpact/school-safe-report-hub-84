import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ReportIncident from './pages/ReportIncident';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import NotFound from './pages/NotFound';
import RouteGuard from './components/RouteGuard';
import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import ClientManagement from './pages/ClientManagement';
import FacilityManagement from './pages/FacilityManagement';
import ConfigurationManagement from './pages/ConfigurationManagement';
import Home from './pages/Home';
import EditIncident from './pages/EditIncident';
import Insights from './pages/Insights';
import Benchmarking from './pages/Benchmarking';
import AssessmentsPage from './pages/AssessmentsPage';
import GrievancesPage from './pages/grievances/GrievancesPage';
import GrievancesDashboardPage from './pages/grievances/GrievancesDashboardPage';
import GrievanceSubmitPage from './pages/grievances/GrievanceSubmitPage';
import ThankYouPage from './pages/grievances/ThankYouPage';
import PublicGrievanceForm from './pages/grievances/PublicGrievanceForm';
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from './pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from './pages/employee-verification/UploadDocumentPage';
import VerificationDashboardPage from './pages/employee-verification/VerificationDashboardPage';
import TransportSafetyPage from './pages/transport-safety/TransportSafetyPage';
import VehicleDetailPage from './pages/transport-safety/VehicleDetailPage';
import DocumentsPage from './pages/transport-safety/DocumentsPage';
import DashboardPage from './pages/transport-safety/DashboardPage';
import EduSafeResourcesPage from './pages/edusafe/EduSafeResourcesPage';
import UploadResourcePage from './pages/edusafe/UploadResourcePage';
import EditResourcePage from './pages/edusafe/EditResourcePage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import FormResponsePage from './pages/feedback/FormResponsePage';
import { Toaster } from 'sonner';
import Support from './pages/Support';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import NewsPage from './pages/NewsPage';

function App() {
  return (
    <>
      <Toaster position="top-right" closeButton />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/support" element={<Support />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/news/:newsId" element={<NewsPage />} />
        <Route path="/grievances/public" element={<PublicGrievanceForm />} />
        <Route path="/grievances/thankyou" element={<ThankYouPage />} />
        
        {/* Protected routes */}
        <Route element={<RouteGuard />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report-incident" element={<ReportIncident />} />
          <Route path="/incidents" element={<IncidentsList />} />
          <Route path="/incidents/:incidentId" element={<IncidentDetail />} />
          <Route path="/incidents/:incidentId/edit" element={<EditIncident />} />
          <Route path="/incident/:incidentId" element={<IncidentDetail />} />
          <Route path="/incident/:incidentId/edit" element={<EditIncident />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/benchmarking" element={<Benchmarking />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/facilities" element={<FacilityManagement />} />
          <Route path="/configuration/*" element={<ConfigurationManagement />} />
          
          {/* Assessment Routes */}
          <Route path="/assessments/*" element={<AssessmentsPage />} />
          
          {/* Grievances Routes */}
          <Route path="/grievances" element={<GrievancesPage />} />
          <Route path="/grievances/dashboard" element={<GrievancesDashboardPage />} />
          <Route path="/grievances/submit" element={<GrievanceSubmitPage />} />
          
          {/* Backoffice Routes */}
          <Route path="/backoffice" element={<BackofficeDashboard />} />
          <Route path="/backoffice/settings" element={<BackofficeSettings />} />
          <Route path="/backoffice/analytics" element={<BackofficeAnalytics />} />
          
          {/* Employee Verification Routes */}
          <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
          <Route path="/employee-verification/dashboard" element={<VerificationDashboardPage />} />
          <Route path="/employee-verification/:employeeId" element={<EmployeeDetailPage />} />
          <Route path="/employee-verification/:employeeId/upload-document" element={<UploadDocumentPage />} />
          
          {/* Transport Safety Routes */}
          <Route path="/transport-safety" element={<TransportSafetyPage />} />
          <Route path="/transport-safety/dashboard" element={<DashboardPage />} />
          <Route path="/transport-safety/vehicle/:vehicleId" element={<VehicleDetailPage />} />
          <Route path="/transport-safety/documents" element={<DocumentsPage />} />
          
          {/* EduSafe Resources Routes */}
          <Route path="/edusafe" element={<EduSafeResourcesPage />} />
          <Route path="/edusafe/upload" element={<UploadResourcePage />} />
          <Route path="/edusafe/edit/:resourceId" element={<EditResourcePage />} />
          
          {/* Feedback Routes */}
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/feedback/response/:formId" element={<FormResponsePage />} />
        </Route>
        
        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;

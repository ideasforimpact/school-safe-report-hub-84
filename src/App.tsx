
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth'; 
import { ClientProvider } from '@/contexts/ClientContext';
import { EmployeeProvider } from './contexts/employee/EmployeeContext';
import { StudentProvider } from './contexts/StudentContext';
import { IncidentProvider } from './contexts/incident/IncidentContext';
import { EmployeeVerificationProvider } from './contexts/employee-verification';
import { FacilityProvider } from './contexts/FacilityContext';
import { AssessmentProvider } from '@/contexts/assessment/AssessmentContext';

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
import EditIncident from '@/pages/EditIncident';
import Insights from '@/pages/Insights';
import FacilityManagement from '@/pages/FacilityManagement';
import AssessmentsPage from '@/pages/AssessmentsPage';
import AssessmentResponsePage from '@/pages/AssessmentResponsePage';
import IncidentConfiguration from '@/pages/IncidentConfiguration';

// Employee Verification Pages
import EmployeeVerificationPage from '@/pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from '@/pages/employee-verification/EmployeeDetailPage';
import UploadDocumentPage from '@/pages/employee-verification/UploadDocumentPage';
import VerificationDashboardPage from '@/pages/employee-verification/VerificationDashboardPage';

function App() {
  return (
    <ClientProvider>
      <AuthProvider>
        <EmployeeProvider>
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
                      
                      {/* Routes that were previously protected - now public */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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

                      {/* Incident routes */}
                      <Route path="/incidents" element={<IncidentsList />} />
                      <Route path="/incidents/:id" element={<IncidentDetail />} />
                      <Route path="/report-incident" element={<ReportIncident />} />
                      <Route path="/edit-incident/:id" element={<EditIncident />} />
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
                      <Route path="/assessments/respond/:assignmentId" element={<AssessmentResponsePage />} />

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

                      {/* 404 route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <Toaster position="top-right" />
                  </AssessmentProvider>
                </EmployeeVerificationProvider>
              </FacilityProvider>
            </StudentProvider>
          </IncidentProvider>
        </EmployeeProvider>
      </AuthProvider>
    </ClientProvider>
  );
}

export default App;


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncidentsList from './pages/IncidentsList';
import ReportIncident from './pages/ReportIncident';
import IncidentDetail from './pages/IncidentDetail';
import EditIncident from './pages/EditIncident';
import Insights from './pages/Insights';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/auth/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { FacilityProvider } from './contexts/FacilityContext';
import { IncidentProvider } from './contexts/IncidentContext';
import { StudentProvider } from './contexts/StudentContext';
import { AssessmentProvider } from './contexts/assessment/AssessmentContext';
import { EmployeeVerificationProvider } from './contexts/EmployeeVerificationContext';
import RouteGuard from './components/RouteGuard';
import ModuleGuard from './components/ModuleGuard';
import ConfigurationManagement from './pages/ConfigurationManagement';
import IncidentConfiguration from './pages/IncidentConfiguration';
import EducationalConfiguration from './pages/EducationalConfiguration';
import OtherConfiguration from './pages/OtherConfiguration';
import UserManagement from './pages/UserManagement';
import StudentManagement from './pages/StudentManagement';
import Support from './pages/Support';
import Blog from './pages/Blog';
import Pricing from './pages/Pricing';
import FacilityManagement from './pages/FacilityManagement';
import ClientManagement from './pages/ClientManagement';
import AssessmentsPage from './pages/AssessmentsPage';
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import EmployeeDetailPage from './pages/employee-verification/EmployeeDetailPage';
import BackofficeAnalytics from './pages/backoffice/BackofficeAnalytics';
import BackofficeSettings from './pages/backoffice/BackofficeSettings';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClientProvider>
          <FacilityProvider>
            <IncidentProvider>
              <StudentProvider>
                <AssessmentProvider>
                  <EmployeeVerificationProvider>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/support" element={<Support />} />
                      
                      {/* Redirect from /report to /report-incident */}
                      <Route path="/report" element={<Navigate to="/report-incident" replace />} />
                      
                      {/* Protected Routes */}
                      <Route element={<RouteGuard />}>
                        {/* Client User Routes */}
                        <Route element={<ModuleGuard moduleType="incidentReporting" />}>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/incidents" element={<IncidentsList />} />
                          <Route path="/incident/:id" element={<IncidentDetail />} />
                          <Route path="/incident/:id/edit" element={<EditIncident />} />
                          <Route path="/report-incident" element={<ReportIncident />} />
                          <Route path="/insights" element={<Insights />} />
                          
                          {/* Assessment Routes */}
                          <Route path="/assessments" element={<AssessmentsPage />} />
                          <Route path="/assessments/templates/*" element={<AssessmentsPage />} />
                          <Route path="/assessments/assignments/*" element={<AssessmentsPage />} />
                          <Route path="/assessments/assignments/:assignmentId/respond/*" element={<AssessmentsPage />} />
                          <Route path="/assessments/results/*" element={<AssessmentsPage />} />
                          
                          {/* Employee Verification Routes */}
                          <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
                          <Route path="/employee-verification/:employeeId" element={<EmployeeDetailPage />} />
                          
                          <Route path="/configuration" element={<ConfigurationManagement />} />
                          <Route path="/incident-configuration" element={<IncidentConfiguration />} />
                          <Route path="/educational-configuration" element={<EducationalConfiguration />} />
                          <Route path="/other-configuration" element={<OtherConfiguration />} />
                          <Route path="/users" element={<UserManagement />} />
                          <Route path="/students" element={<StudentManagement />} />
                          <Route path="/facilities" element={<FacilityManagement />} />
                        </Route>
                        
                        {/* Backoffice Routes - SaaS Owner Routes */}
                        <Route element={<RouteGuard requireSaasOwner={true} />}>
                          {/* Redirect SaaS owner from /backoffice to /dashboard */}
                          <Route path="/backoffice" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/backoffice/clients" element={<ClientManagement />} />
                          <Route path="/backoffice/analytics" element={<BackofficeAnalytics />} />
                          <Route path="/backoffice/settings" element={<BackofficeSettings />} />
                        </Route>
                      </Route>
                      
                      {/* Not Found */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </EmployeeVerificationProvider>
                </AssessmentProvider>
              </StudentProvider>
            </IncidentProvider>
          </FacilityProvider>
        </ClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

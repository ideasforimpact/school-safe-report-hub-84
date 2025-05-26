import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import { AssessmentProvider } from '@/contexts/assessment/AssessmentContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssessmentsPage from './pages/AssessmentsPage';
import AnswerAssessmentPage from './pages/AnswerAssessmentPage';
import EmployeeManagement from './pages/EmployeeManagement';
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import ReportIncident from './pages/ReportIncident';
import BackofficeLogin from './pages/BackofficeLogin';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import EditIncidentPage from './pages/EditIncidentPage';
import { IncidentProvider } from './contexts/IncidentContext';
import { SettingsProvider } from './contexts/SettingsContext';
import SettingsPage from './pages/SettingsPage';
import { UserProvider } from './contexts/UserContext';
import UsersPage from './pages/UsersPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import { AccessControlProvider } from './contexts/AccessControlContext';
import { RoleProvider } from './contexts/RoleContext';
import RolesPage from './pages/RolesPage';
import CreateRolePage from './pages/CreateRolePage';
import EditRolePage from './pages/EditRolePage';
import AccessControlPage from './pages/AccessControlPage';
import { PermissionProvider } from './contexts/PermissionContext';
import PermissionsPage from './pages/PermissionsPage';
import CreatePermissionPage from './pages/CreatePermissionPage';
import EditPermissionPage from './pages/EditPermissionPage';

function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <IncidentProvider>
          <SettingsProvider>
            <UserProvider>
              <AccessControlProvider>
                <RoleProvider>
                  <PermissionProvider>
                    <Router>
                      <div className="min-h-screen bg-gray-50">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/assessments" element={<AssessmentsPage />} />
                          <Route path="/assessments/answer/:assessmentId" element={<AnswerAssessmentPage />} />
                          <Route path="/employees" element={<EmployeeManagement />} />
                          <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
                          <Route path="/report-incident" element={<ReportIncident />} />
                          <Route path="/backoffice/login" element={<BackofficeLogin />} />
                          <Route path="/incidents" element={<IncidentsPage />} />
                          <Route path="/incident/:incidentId" element={<IncidentDetailPage />} />
                          <Route path="/incident/:incidentId/edit" element={<EditIncidentPage />} />
                          <Route path="/settings" element={<SettingsPage />} />

                          {/* User Management Routes */}
                          <Route path="/users" element={<UsersPage />} />
                          <Route path="/users/create" element={<CreateUserPage />} />
                          <Route path="/users/:userId/edit" element={<EditUserPage />} />

                          {/* Access Control Management Routes */}
                          <Route path="/access-control" element={<AccessControlPage />} />

                          {/* Role Management Routes */}
                          <Route path="/roles" element={<RolesPage />} />
                          <Route path="/roles/create" element={<CreateRolePage />} />
                          <Route path="/roles/:roleId/edit" element={<EditRolePage />} />

                          {/* Permission Management Routes */}
                          <Route path="/permissions" element={<PermissionsPage />} />
                          <Route path="/permissions/create" element={<CreatePermissionPage />} />
                          <Route path="/permissions/:permissionId/edit" element={<EditPermissionPage />} />
                        </Routes>
                        <Toaster />
                      </div>
                    </Router>
                  </PermissionProvider>
                </RoleProvider>
              </AccessControlProvider>
            </UserProvider>
          </SettingsProvider>
        </IncidentProvider>
      </AssessmentProvider>
    </AuthProvider>
  );
}

export default App;

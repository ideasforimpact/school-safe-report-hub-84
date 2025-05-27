
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth/AuthProvider';
import { AssessmentProvider } from '@/contexts/assessment/AssessmentContext';
import { IncidentProvider } from './contexts/IncidentContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssessmentsPage from './pages/AssessmentsPage';
import AnswerAssessmentPage from './pages/AnswerAssessmentPage';
import EmployeeManagement from './pages/EmployeeManagement';
import EmployeeVerificationPage from './pages/employee-verification/EmployeeVerificationPage';
import ReportIncident from './pages/ReportIncident';
import BackofficeLogin from './pages/BackofficeLogin';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import EditIncidentPage from './pages/EditIncidentPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <IncidentProvider>
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
                <Route path="/incidents" element={<IncidentsList />} />
                <Route path="/incident/:incidentId" element={<IncidentDetail />} />
                <Route path="/incident/:incidentId/edit" element={<EditIncidentPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </IncidentProvider>
      </AssessmentProvider>
    </AuthProvider>
  );
}

export default App;

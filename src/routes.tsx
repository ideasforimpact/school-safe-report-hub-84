
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

import PublicLayout from '@/components/layout/PublicLayout';
import Loading from '@/components/Loading';
import NotFound from '@/pages/NotFound';

// Lazy-loaded components
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const IncidentsPage = lazy(() => import('@/pages/IncidentsPage'));
const IncidentDetail = lazy(() => import('@/pages/IncidentDetail'));
const AddIncidentPage = lazy(() => import('@/pages/AddIncidentPage'));
const EditIncidentPage = lazy(() => import('@/pages/EditIncidentPage'));
const EmployeesPage = lazy(() => import('@/pages/employee/EmployeesPage'));
const VerificationDashboard = lazy(() => import('@/pages/employee-verification/VerificationDashboard'));
const EmployeeVerificationPage = lazy(() => import('@/pages/employee-verification/EmployeeVerificationPage'));
const UploadDocumentPage = lazy(() => import('@/pages/employee-verification/UploadDocumentPage'));
const EmployeeDetailsPage = lazy(() => import('@/pages/employee-verification/EmployeeDetailsPage'));
const EducationalConfig = lazy(() => import('@/pages/configuration/EducationalConfig'));
const IncidentConfiguration = lazy(() => import('@/pages/IncidentConfiguration'));
const ClientsPage = lazy(() => import('@/pages/backoffice/ClientsPage'));
const ClientDetailPage = lazy(() => import('@/pages/backoffice/ClientDetailPage'));
const EditClientPage = lazy(() => import('@/pages/backoffice/EditClientPage'));
const AddClientPage = lazy(() => import('@/pages/backoffice/AddClientPage'));
const SettingsPage = lazy(() => import('@/pages/backoffice/SettingsPage'));

// Route imports
const assessmentRoutes = lazy(() => import('@/routes/assessmentRoutes'));

// Layout with authentication
interface PrivateLayoutProps {
  children: React.ReactNode;
}

const PrivateLayout: React.FC<PrivateLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicOnlyLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <PublicLayout>{children}</PublicLayout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        } />
        
        <Route path="/login" element={
          <PublicOnlyLayout>
            <Login />
          </PublicOnlyLayout>
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <PrivateLayout>
            <Dashboard />
          </PrivateLayout>
        } />
        
        <Route path="/incidents" element={
          <PrivateLayout>
            <IncidentsPage />
          </PrivateLayout>
        } />
        
        <Route path="/incidents/add" element={
          <PrivateLayout>
            <AddIncidentPage />
          </PrivateLayout>
        } />
        
        <Route path="/incidents/:id" element={
          <PrivateLayout>
            <IncidentDetail />
          </PrivateLayout>
        } />
        
        <Route path="/incidents/:id/edit" element={
          <PrivateLayout>
            <EditIncidentPage />
          </PrivateLayout>
        } />
        
        <Route path="/employees" element={
          <PrivateLayout>
            <EmployeesPage />
          </PrivateLayout>
        } />
        
        <Route path="/verification-dashboard" element={
          <PrivateLayout>
            <VerificationDashboard />
          </PrivateLayout>
        } />
        
        <Route path="/employee-verification" element={
          <PrivateLayout>
            <EmployeeVerificationPage />
          </PrivateLayout>
        } />
        
        <Route path="/employee-verification/upload-document/:employeeId" element={
          <PrivateLayout>
            <UploadDocumentPage />
          </PrivateLayout>
        } />
        
        <Route path="/employee-verification/:employeeId" element={
          <PrivateLayout>
            <EmployeeDetailsPage />
          </PrivateLayout>
        } />
        
        <Route path="/configuration/educational" element={
          <PrivateLayout>
            <EducationalConfig />
          </PrivateLayout>
        } />
        
        <Route path="/incident-configuration" element={
          <PrivateLayout>
            <IncidentConfiguration />
          </PrivateLayout>
        } />
        
        {/* Backoffice routes */}
        <Route path="/backoffice/clients" element={
          <PrivateLayout>
            <ClientsPage />
          </PrivateLayout>
        } />
        
        <Route path="/backoffice/clients/:id" element={
          <PrivateLayout>
            <ClientDetailPage />
          </PrivateLayout>
        } />
        
        <Route path="/backoffice/clients/:id/edit" element={
          <PrivateLayout>
            <EditClientPage />
          </PrivateLayout>
        } />
        
        <Route path="/backoffice/clients/add" element={
          <PrivateLayout>
            <AddClientPage />
          </PrivateLayout>
        } />
        
        <Route path="/backoffice/settings" element={
          <PrivateLayout>
            <SettingsPage />
          </PrivateLayout>
        } />
        
        {/* Assessment routes */}
        <Route path="/assessments/*" element={
          <PrivateLayout>
            <React.Suspense fallback={<Loading />}>
              {assessmentRoutes}
            </React.Suspense>
          </PrivateLayout>
        } />
        
        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;


import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth/AuthContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { EmployeeProvider } from './contexts/employee/EmployeeContext';
import { StudentProvider } from './contexts/StudentContext';
import { IncidentProvider } from './contexts/IncidentContext';

// Pages
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import UserManagement from '@/pages/UserManagement';
import ClientManagement from '@/pages/ClientManagement';
import EmployeeManagement from '@/pages/EmployeeManagement';
import StudentManagement from '@/pages/StudentManagement';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <ClientProvider>
      <AuthProvider>
        <EmployeeProvider>
          <IncidentProvider>
            <StudentProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/clients" element={<ClientManagement />} />
                <Route path="/employees" element={<EmployeeManagement />} />
                <Route path="/students" element={<StudentManagement />} />

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster position="top-right" />
            </StudentProvider>
          </IncidentProvider>
        </EmployeeProvider>
      </AuthProvider>
    </ClientProvider>
  );
}

export default App;

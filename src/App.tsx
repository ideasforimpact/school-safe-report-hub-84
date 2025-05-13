
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import Dashboard from './pages/Dashboard';
import { Toaster } from "@/components/ui/toaster";
import { IncidentProvider } from './contexts/IncidentContext';
import IncidentReport from './pages/IncidentReport';
import Protected from './components/auth/Protected';
import { ThemeProvider } from './components/theme-provider';

function App() {
  return (
    <AuthProvider>
      <ClientProvider>
        <IncidentProvider>
          <ThemeProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={
                <Protected>
                  <Dashboard />
                </Protected>
              } />
              <Route path="/dashboard" element={
                <Protected>
                  <Dashboard />
                </Protected>
              } />
              <Route path="/incident-report" element={
                <Protected>
                  <IncidentReport />
                </Protected>
              } />
            </Routes>
          </ThemeProvider>
        </IncidentProvider>
      </ClientProvider>
    </AuthProvider>
  );
}

export default App;

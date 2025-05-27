
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import routes from './routes';
import { AuthProvider } from './contexts/auth/AuthProvider';
import { EmployeeProvider } from './store/EmployeeContext';
import { ClientProvider } from './contexts/ClientContext';
import { EmployeeVerificationProvider } from './contexts/employee-verification';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider>
        <EmployeeProvider>
          <EmployeeVerificationProvider>
            <AuthProvider>
              <RouterProvider router={routes} />
              <Toaster />
            </AuthProvider>
          </EmployeeVerificationProvider>
        </EmployeeProvider>
      </ClientProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;

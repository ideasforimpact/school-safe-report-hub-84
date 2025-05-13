
import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useTransportSafety, TransportSafetyProvider } from '@/contexts/transport-safety/TransportSafetyContext';
import { TransportSafetyContextType } from '@/contexts/transport-safety/types';
import { mockTransportSafetyContext } from './mocks';

// Import Jest DOM to extend expect with DOM matchers
import '@testing-library/jest-dom';

export const renderWithRouter = (
  ui: React.ReactElement,
  { 
    path = '/', 
    route = '/',
    transportSafetyContext = mockTransportSafetyContext 
  } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route 
          path={path} 
          element={
            <TransportSafetyProvider>
              {React.cloneElement(ui, { transportSafetyContext })}
            </TransportSafetyProvider>
          } 
        />
      </Routes>
    </MemoryRouter>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  { transportSafetyContext = mockTransportSafetyContext } = {}
) => {
  return render(
    <TransportSafetyProvider>
      {React.cloneElement(ui, { transportSafetyContext })}
    </TransportSafetyProvider>
  );
};

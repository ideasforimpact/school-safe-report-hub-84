
import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TransportSafetyContext } from '@/contexts/transport-safety/TransportSafetyContext';
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
    <TransportSafetyContext.Provider value={transportSafetyContext as TransportSafetyContextType}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </TransportSafetyContext.Provider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  { transportSafetyContext = mockTransportSafetyContext } = {}
) => {
  return render(
    <TransportSafetyContext.Provider value={transportSafetyContext as TransportSafetyContextType}>
      {ui}
    </TransportSafetyContext.Provider>
  );
};

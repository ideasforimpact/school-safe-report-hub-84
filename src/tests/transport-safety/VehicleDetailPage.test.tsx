
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleDetailPage from '@/pages/transport-safety/VehicleDetailPage';
import '@testing-library/jest-dom';

// Mock the Layout component
jest.mock('@/components/layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-mock">{children}</div>
  )
}));

// Mock VehicleDetailContent component
jest.mock('@/components/transport-safety/vehicle-detail/VehicleDetailContent', () => ({
  __esModule: true,
  default: () => <div data-testid="vehicle-detail-content-mock">Vehicle Detail Content</div>
}));

describe('VehicleDetailPage', () => {
  it('renders the layout component', () => {
    renderWithRouter(<VehicleDetailPage />);
    
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
  });

  it('renders the transport safety provider', () => {
    renderWithRouter(<VehicleDetailPage />);
    
    // The provider itself doesn't render any DOM elements,
    // but we can verify its child component is rendered
    expect(screen.getByTestId('vehicle-detail-content-mock')).toBeInTheDocument();
  });

  it('renders the vehicle detail content', () => {
    renderWithRouter(<VehicleDetailPage />);
    
    expect(screen.getByText('Vehicle Detail Content')).toBeInTheDocument();
  });
});

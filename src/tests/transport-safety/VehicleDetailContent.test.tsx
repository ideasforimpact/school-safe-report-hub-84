
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleDetailContent from '@/components/transport-safety/vehicle-detail/VehicleDetailContent';
import { mockTransportSafetyContext } from './mocks';

// Mock the useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    vehicleId: 'test-vehicle-id'
  })
}));

describe('VehicleDetailContent', () => {
  it('renders vehicle detail components when vehicle exists', () => {
    renderWithRouter(<VehicleDetailContent />);
    
    // Check if each component is rendered
    expect(screen.getByText(/back to vehicles/i)).toBeInTheDocument(); // Header
    expect(screen.getByText(/toyota coaster/i)).toBeInTheDocument(); // InfoCard
    expect(screen.getByText('Document Status')).toBeInTheDocument(); // DocumentsCard
    expect(screen.getByRole('tab', { name: /documents/i })).toBeInTheDocument(); // Tabs
  });

  it('renders not found component when vehicle does not exist', () => {
    const customContext = {
      ...mockTransportSafetyContext,
      getVehicle: jest.fn().mockReturnValue(undefined)
    };
    
    renderWithRouter(
      <VehicleDetailContent />, 
      { transportSafetyContext: customContext }
    );
    
    expect(screen.getByText('Vehicle Not Found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or has been removed/)).toBeInTheDocument();
  });
});

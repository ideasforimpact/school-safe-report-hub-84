
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDocumentsCard from '../../components/transport-safety/VehicleDocumentsCard';
import { Vehicle } from '@/types/transportSafety';

describe('VehicleDocumentsCard', () => {
  it('renders without crashing', () => {
    // Create a minimal vehicle object that satisfies the VehicleDocumentsCardProps
    const mockVehicle: Vehicle = {
      id: 'test-id',
      registrationNumber: 'ABC123',
      type: 'car',
      make: 'Test Make',
      model: 'Test Model',
      year: 2020,
      driver: 'Test Driver',
      route: 'Test Route',
      documents: [],
      status: 'active',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    };

    const { getByText } = render(<VehicleDocumentsCard vehicle={mockVehicle} />);
    expect(getByText('Vehicle Documents')).toBeInTheDocument();
  });
});

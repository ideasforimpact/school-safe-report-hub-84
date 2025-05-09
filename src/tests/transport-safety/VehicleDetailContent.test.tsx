
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDetailContent from '../../components/transport-safety/VehicleDetailContent';

test('renders vehicle detail content', () => {
  const vehicleData = {
    id: '1',
    make: 'Toyota',
    model: 'Coaster',
    year: 2020,
    type: 'bus',
    licensePlate: 'ABC-123',
    capacity: 30,
    status: 'active',
    vinNumber: 'VIN12345',
    fuelType: 'diesel',
    registrationExpiry: '2023-12-31',
    lastServiceDate: '2023-06-15',
    nextServiceDue: '2023-12-15',
    mileage: 50000,
    insuranceProvider: 'Safety Insurance',
    insuranceExpiry: '2023-12-31',
    assignedDriver: 'John Doe',
    notes: 'Regular maintenance performed',
    ownedBySchool: true,
    schoolId: 'school-1'
  };

  const { getByText } = render(
    <VehicleDetailContent vehicle={vehicleData} />
  );
  
  expect(getByText('Toyota Coaster')).toBeInTheDocument();
});

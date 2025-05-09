
import React from 'react';
import { render } from '@testing-library/react';
import { VehicleHeader } from '../../components/transport-safety/Header';

test('renders vehicle header', () => {
  const vehicle = {
    id: '1',
    make: 'Toyota',
    model: 'Coaster',
    year: 2020,
    licensePlate: 'ABC-123',
    status: 'active'
  };

  const { getByText } = render(
    <VehicleHeader 
      vehicle={vehicle}
      onEditClick={() => {}}
      onDeleteClick={() => {}}
    />
  );
  
  expect(getByText('Toyota Coaster (2020)')).toBeInTheDocument();
  expect(getByText('ABC-123')).toBeInTheDocument();
});

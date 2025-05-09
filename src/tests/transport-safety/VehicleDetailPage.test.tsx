
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDetailPage from '../../pages/transport-safety/VehicleDetailPage';
import { BrowserRouter } from 'react-router-dom';

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ vehicleId: '1' }),
  useNavigate: () => jest.fn()
}));

// Mock the vehicle service
jest.mock('../../services/transport-safety/vehicleService', () => ({
  getVehicleById: () => ({
    id: '1',
    make: 'Toyota',
    model: 'Coaster',
    year: 2020,
    type: 'bus',
    licensePlate: 'ABC-123',
    status: 'active'
  })
}));

test('renders vehicle detail page', () => {
  const { getByText } = render(
    <BrowserRouter>
      <VehicleDetailPage />
    </BrowserRouter>
  );
  
  expect(getByText(/vehicle details/i)).toBeInTheDocument();
});


import React from 'react';
import { render } from '@testing-library/react';
import { VehicleInfoCard } from '../../components/transport-safety/InfoCard';

test('renders vehicle info card', () => {
  const { getByText } = render(<VehicleInfoCard />);
  expect(getByText(/Vehicle Info Card Placeholder/i)).toBeInTheDocument();
});

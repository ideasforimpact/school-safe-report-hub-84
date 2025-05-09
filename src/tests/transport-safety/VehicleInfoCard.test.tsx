
import React from 'react';
import { render } from '@testing-library/react';
import VehicleInfoCard from '../../components/transport-safety/VehicleInfoCard';

test('renders VehicleInfoCard component', () => {
  const { container } = render(<VehicleInfoCard />);
  expect(container).toBeInTheDocument();
});

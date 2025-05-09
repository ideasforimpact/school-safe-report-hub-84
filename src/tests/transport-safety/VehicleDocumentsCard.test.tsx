
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDocumentsCard from '../../components/transport-safety/VehicleDocumentsCard';

test('renders VehicleDocumentsCard component', () => {
  const { container } = render(<VehicleDocumentsCard />);
  expect(container).toBeInTheDocument();
});

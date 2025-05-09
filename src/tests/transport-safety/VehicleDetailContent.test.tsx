
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDetailContent from '../../components/transport-safety/VehicleDetailContent';

test('renders VehicleDetailContent component', () => {
  const { container } = render(<VehicleDetailContent />);
  expect(container).toBeInTheDocument();
});

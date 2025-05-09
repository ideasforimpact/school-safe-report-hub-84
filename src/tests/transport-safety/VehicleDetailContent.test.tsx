
import React from 'react';
import { render } from '@testing-library/react';
import { VehicleDetailContent } from '../../components/transport-safety/DetailContent';

test('renders vehicle detail content', () => {
  const { getByText } = render(<VehicleDetailContent />);
  expect(getByText(/Vehicle Detail Content Placeholder/i)).toBeInTheDocument();
});

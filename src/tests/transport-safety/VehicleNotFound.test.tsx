
import React from 'react';
import { render } from '@testing-library/react';
import { VehicleNotFound } from '../../components/transport-safety/NotFound';

test('renders vehicle not found message', () => {
  const { getByText } = render(<VehicleNotFound />);
  expect(getByText(/vehicle not found/i)).toBeInTheDocument();
});

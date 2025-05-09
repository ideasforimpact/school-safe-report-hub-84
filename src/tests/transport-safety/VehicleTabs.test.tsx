
import React from 'react';
import { render } from '@testing-library/react';
import { VehicleTabs } from '../../components/transport-safety/Tabs';

test('renders vehicle tabs', () => {
  const { getByText } = render(<VehicleTabs />);
  expect(getByText(/Vehicle Tabs Placeholder/i)).toBeInTheDocument();
});

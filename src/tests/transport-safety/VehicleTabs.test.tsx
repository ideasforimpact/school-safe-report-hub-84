
import React from 'react';
import { render } from '@testing-library/react';
import VehicleTabs from '../../components/transport-safety/VehicleTabs';

describe('VehicleTabs', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VehicleTabs />);
    expect(getByText('Vehicle Tabs')).toBeInTheDocument();
  });
});

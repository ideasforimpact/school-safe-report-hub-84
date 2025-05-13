
import React from 'react';
import { render } from '@testing-library/react';
import VehicleInfoCard from '../../components/transport-safety/VehicleInfoCard';

describe('VehicleInfoCard', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VehicleInfoCard />);
    expect(getByText('Vehicle Info Card')).toBeInTheDocument();
  });
});

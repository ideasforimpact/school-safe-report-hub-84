
import React from 'react';
import { render } from '@testing-library/react';
import VehicleHeader from '../../components/transport-safety/VehicleHeader';

describe('VehicleHeader', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VehicleHeader />);
    expect(getByText('Vehicle Header')).toBeInTheDocument();
  });
});


import React from 'react';
import { render } from '@testing-library/react';
import VehicleNotFound from '../../components/transport-safety/VehicleNotFound';

describe('VehicleNotFound', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VehicleNotFound />);
    expect(getByText('Vehicle Not Found')).toBeInTheDocument();
  });
});

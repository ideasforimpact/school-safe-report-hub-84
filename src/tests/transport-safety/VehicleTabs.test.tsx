
import React from 'react';
import { render } from '@testing-library/react';
import VehicleTabs from '../../components/transport-safety/VehicleTabs';
import { MemoryRouter } from 'react-router-dom';

describe('VehicleTabs', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <MemoryRouter>
        <VehicleTabs />
      </MemoryRouter>
    );
    expect(getByText('Vehicle Documents')).toBeInTheDocument();
  });
});

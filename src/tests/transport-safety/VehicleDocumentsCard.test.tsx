
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDocumentsCard from '../../components/transport-safety/VehicleDocumentsCard';

describe('VehicleDocumentsCard', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<VehicleDocumentsCard />);
    expect(getByText('Vehicle Documents Card')).toBeInTheDocument();
  });
});

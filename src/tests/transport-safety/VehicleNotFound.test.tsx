
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleNotFound from '@/components/transport-safety/vehicle-detail/VehicleNotFound';
import '@testing-library/jest-dom';

describe('VehicleNotFound', () => {
  it('renders not found message', () => {
    renderWithRouter(<VehicleNotFound />);
    
    expect(screen.getByText('Vehicle Not Found')).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or has been removed/)).toBeInTheDocument();
  });

  it('renders return link to vehicles list', () => {
    renderWithRouter(<VehicleNotFound />);
    
    const returnLink = screen.getByRole('link', { name: /return to vehicles list/i });
    expect(returnLink).toBeInTheDocument();
    expect(returnLink).toHaveAttribute('href', '/transport-safety');
  });

  it('contains the alert icon', () => {
    renderWithRouter(<VehicleNotFound />);
    
    const alertIcon = screen.getByTestId('alert-circle-icon');
    expect(alertIcon).toBeInTheDocument();
  });
});

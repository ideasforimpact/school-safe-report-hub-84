
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleHeader from '@/components/transport-safety/vehicle-detail/VehicleHeader';
import '@testing-library/jest-dom';

describe('VehicleHeader', () => {
  it('renders back button correctly', () => {
    renderWithRouter(<VehicleHeader />);
    
    const backButton = screen.getByRole('link', { name: /back to vehicles/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', '/transport-safety');
  });

  it('contains the correct icon', () => {
    renderWithRouter(<VehicleHeader />);
    
    // Check if ArrowLeft icon is rendered
    const icon = screen.getByTestId('arrow-left-icon');
    expect(icon).toBeInTheDocument();
  });
});

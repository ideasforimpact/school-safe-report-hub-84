
import React from 'react';
import { render } from '@testing-library/react';
import VehicleDetailContent from '../../components/transport-safety/VehicleDetailContent';

describe('VehicleDetailContent', () => {
  it('renders without crashing', () => {
    render(<VehicleDetailContent />);
    // Basic test to verify it renders
  });
});


import React from 'react';
import { render } from '@testing-library/react';
import VehicleNotFound from '../../components/transport-safety/VehicleNotFound';
import { BrowserRouter } from 'react-router-dom';

test('renders VehicleNotFound component', () => {
  const { container } = render(
    <BrowserRouter>
      <VehicleNotFound />
    </BrowserRouter>
  );
  expect(container).toBeInTheDocument();
});
